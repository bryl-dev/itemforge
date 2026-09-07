import { Op, type Transaction, type WhereOptions } from 'sequelize';
import { Choice } from '../domain/models/Choice.js';
import { Question } from '../domain/models/Question.js';
import type { QuestionStatus, RubricFinding } from '../domain/types.js';

export interface CreateChoiceRecord {
  label: string;
  content: string;
  isCorrect: boolean;
  rationale?: string | null;
  ordinal: number;
}

export interface CreateQuestionRecord {
  sourceId?: string | null;
  generationRunId?: string | null;
  stem: string;
  originalStem: string;
  type: Question['type'];
  difficulty: Question['difficulty'];
  bloomLevel: Question['bloomLevel'];
  explanation?: string | null;
  status: QuestionStatus;
  rubricFindings: RubricFinding[];
  embedding?: number[] | null;
  duplicateOfId?: string | null;
  duplicateSimilarity?: number | null;
  choices: CreateChoiceRecord[];
}

export interface ListQuestionsFilter {
  status?: QuestionStatus;
  sourceId?: string;
  page: number;
  pageSize: number;
}

export class QuestionRepository {
  async create(input: CreateQuestionRecord, transaction?: Transaction): Promise<Question> {
    const question = await Question.create(
      {
        sourceId: input.sourceId ?? null,
        generationRunId: input.generationRunId ?? null,
        stem: input.stem,
        originalStem: input.originalStem,
        type: input.type,
        difficulty: input.difficulty,
        bloomLevel: input.bloomLevel,
        explanation: input.explanation ?? null,
        status: input.status,
        rubricFindings: input.rubricFindings,
        embedding: input.embedding ?? null,
        duplicateOfId: input.duplicateOfId ?? null,
        duplicateSimilarity: input.duplicateSimilarity ?? null,
      },
      { transaction },
    );

    await Choice.bulkCreate(
      input.choices.map((choice) => ({ ...choice, questionId: question.id })),
      { transaction },
    );

    return this.findById(question.id, transaction) as Promise<Question>;
  }

  async findById(id: string, transaction?: Transaction): Promise<Question | null> {
    return Question.findByPk(id, {
      include: [{ model: Choice, as: 'choices' }],
      order: [[{ model: Choice, as: 'choices' }, 'ordinal', 'ASC']],
      transaction,
    });
  }

  async list(filter: ListQuestionsFilter): Promise<{ rows: Question[]; count: number }> {
    const where: WhereOptions<Question> = {};
    if (filter.status) {
      where.status = filter.status;
    }
    if (filter.sourceId) {
      where.sourceId = filter.sourceId;
    }

    return Question.findAndCountAll({
      where,
      include: [{ model: Choice, as: 'choices' }],
      distinct: true,
      order: [['createdAt', 'DESC']],
      limit: filter.pageSize,
      offset: (filter.page - 1) * filter.pageSize,
    });
  }

  async listWithEmbeddings(excludeId?: string): Promise<Question[]> {
    const where: WhereOptions<Question> = {
      embedding: { [Op.ne]: null },
      status: { [Op.ne]: 'rejected' },
    };
    if (excludeId) {
      (where as { id?: unknown }).id = { [Op.ne]: excludeId };
    }
    return Question.findAll({
      where,
      attributes: ['id', 'stem', 'embedding', 'status'],
    });
  }

  async update(
    id: string,
    values: Partial<Question>,
    transaction?: Transaction,
  ): Promise<void> {
    await Question.update(values, { where: { id }, transaction });
  }

  async replaceChoices(
    questionId: string,
    choices: CreateChoiceRecord[],
    transaction?: Transaction,
  ): Promise<void> {
    await Choice.destroy({ where: { questionId }, transaction });
    await Choice.bulkCreate(
      choices.map((choice) => ({ ...choice, questionId })),
      { transaction },
    );
  }

  async delete(id: string): Promise<number> {
    return Question.destroy({ where: { id } });
  }
}
