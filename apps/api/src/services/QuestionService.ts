import {
  toQuestionDto,
  toReviewEventDto,
  type Paginated,
  type QuestionDto,
  type ReviewEventDto,
} from '../domain/dto.js';
import type { QuestionStatus } from '../domain/types.js';
import { levenshtein } from '../domain/text.js';
import { ConflictError, NotFoundError, ValidationError } from '../http/errors.js';
import type {
  CreateQuestionInput,
  ListQuestionsQuery,
  ReviewActionInput,
  UpdateQuestionInput,
} from '../http/schemas.js';
import { QuestionRepository } from '../repositories/QuestionRepository.js';
import { ReviewEventRepository } from '../repositories/ReviewEventRepository.js';

const REVIEWABLE: ReadonlySet<QuestionStatus> = new Set(['draft', 'needs_review']);

export class QuestionService {
  constructor(
    private readonly questions: QuestionRepository,
    private readonly events: ReviewEventRepository,
  ) {}

  async create(input: CreateQuestionInput): Promise<QuestionDto> {
    this.assertChoiceSet(input.choices);
    const question = await this.questions.create({
      sourceId: input.sourceId ?? null,
      stem: input.stem,
      originalStem: input.stem,
      type: input.type,
      difficulty: input.difficulty,
      bloomLevel: input.bloomLevel,
      explanation: input.explanation ?? null,
      status: 'draft',
      rubricFindings: [],
      choices: input.choices,
    });
    return toQuestionDto(question);
  }

  async list(query: ListQuestionsQuery): Promise<Paginated<QuestionDto>> {
    const { rows, count } = await this.questions.list({
      status: query.status,
      sourceId: query.sourceId,
      page: query.page,
      pageSize: query.pageSize,
    });

    return {
      items: rows.map(toQuestionDto),
      page: query.page,
      pageSize: query.pageSize,
      total: count,
    };
  }

  async get(id: string): Promise<QuestionDto> {
    const question = await this.questions.findById(id);
    if (!question) {
      throw new NotFoundError('Question', id);
    }
    return toQuestionDto(question);
  }

  async update(id: string, input: UpdateQuestionInput): Promise<QuestionDto> {
    const question = await this.require(id);
    const stemBefore = question.stem;
    const stemAfter = input.stem ?? question.stem;

    await this.questions.update(id, {
      stem: stemAfter,
      explanation: input.explanation === undefined ? question.explanation : input.explanation,
      difficulty: input.difficulty ?? question.difficulty,
      bloomLevel: input.bloomLevel ?? question.bloomLevel,
      type: input.type ?? question.type,
    });

    if (input.choices) {
      this.assertChoiceSet(input.choices);
      await this.questions.replaceChoices(id, input.choices);
    }

    if (input.stem && input.stem !== stemBefore) {
      await this.events.create({
        questionId: id,
        action: 'edited',
        fromStatus: question.status,
        toStatus: question.status,
        stemBefore,
        stemAfter,
        editDistance: levenshtein(stemBefore, stemAfter),
      });
    }

    return this.get(id);
  }

  async approve(id: string, input: ReviewActionInput): Promise<QuestionDto> {
    const question = await this.require(id);
    if (!REVIEWABLE.has(question.status)) {
      throw new ConflictError(
        `Question ${id} cannot be approved from status '${question.status}'.`,
      );
    }
    return this.transition(question.id, question.status, 'approved', 'approved', input);
  }

  async reject(id: string, input: ReviewActionInput): Promise<QuestionDto> {
    const question = await this.require(id);
    if (question.status === 'rejected') {
      throw new ConflictError(`Question ${id} is already rejected.`);
    }
    return this.transition(question.id, question.status, 'rejected', 'rejected', input);
  }

  async reopen(id: string, input: ReviewActionInput): Promise<QuestionDto> {
    const question = await this.require(id);
    if (question.status !== 'rejected' && question.status !== 'approved') {
      throw new ConflictError(
        `Question ${id} cannot be reopened from status '${question.status}'.`,
      );
    }
    return this.transition(question.id, question.status, 'needs_review', 'reopened', input);
  }

  async history(id: string): Promise<ReviewEventDto[]> {
    await this.require(id);
    const events = await this.events.listByQuestion(id);
    return events.map(toReviewEventDto);
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.questions.delete(id);
    if (deleted === 0) {
      throw new NotFoundError('Question', id);
    }
  }

  private async transition(
    id: string,
    from: QuestionStatus,
    to: QuestionStatus,
    action: 'approved' | 'rejected' | 'reopened',
    input: ReviewActionInput,
  ): Promise<QuestionDto> {
    await this.questions.update(id, { status: to });
    await this.events.create({
      questionId: id,
      action,
      actor: input.actor,
      fromStatus: from,
      toStatus: to,
      note: input.note ?? null,
    });
    return this.get(id);
  }

  private async require(id: string) {
    const question = await this.questions.findById(id);
    if (!question) {
      throw new NotFoundError('Question', id);
    }
    return question;
  }

  private assertChoiceSet(choices: UpdateQuestionInput['choices']): void {
    if (!choices) {
      return;
    }
    const correct = choices.filter((choice) => choice.isCorrect).length;
    if (correct !== 1) {
      throw new ValidationError('A question must have exactly one correct choice.', {
        correctCount: correct,
      });
    }
  }
}
