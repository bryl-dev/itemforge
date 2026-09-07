import type { AiEngine, EngineItem } from '../clients/AiEngineClient.js';
import { toGenerationRunDto, toQuestionDto, type GenerationRunDto, type QuestionDto } from '../domain/dto.js';
import { NotFoundError } from '../http/errors.js';
import type { GenerateQuestionsInput } from '../http/schemas.js';
import type { BloomLevel, QuestionType, RubricFinding } from '../domain/types.js';
import { SourceChunkRepository, SourceRepository } from '../repositories/SourceRepository.js';
import { GenerationRunRepository } from '../repositories/GenerationRunRepository.js';
import { QuestionRepository } from '../repositories/QuestionRepository.js';
import type { Rubric } from './rubric/Rubric.js';
import type { SimilarityIndex } from './similarity/SimilarityIndex.js';

export interface GenerateOutput {
  run: GenerationRunDto;
  questions: QuestionDto[];
}

const CHOICE_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

export class GenerationService {
  constructor(
    private readonly sources: SourceRepository,
    private readonly chunks: SourceChunkRepository,
    private readonly runs: GenerationRunRepository,
    private readonly questions: QuestionRepository,
    private readonly engine: AiEngine,
    private readonly rubric: Rubric,
    private readonly similarity: SimilarityIndex,
  ) {}

  async generate(sourceId: string, input: GenerateQuestionsInput): Promise<GenerateOutput> {
    const source = await this.sources.findById(sourceId);
    if (!source) {
      throw new NotFoundError('Source', sourceId);
    }

    const chunked = await this.engine.chunk(source.content);
    const embeddings = await this.engine.embed(chunked.map((chunk) => chunk.content));
    await this.chunks.replaceForSource(
      source.id,
      chunked.map((chunk, index) => ({
        sourceId: source.id,
        ordinal: chunk.ordinal,
        content: chunk.content,
        embedding: embeddings[index] ?? null,
      })),
    );
    await this.sources.updateStatus(source.id, 'chunked');

    const run = await this.runs.create({
      sourceId: source.id,
      provider: 'pending',
      model: 'pending',
      promptVersion: 'pending',
      requestedCount: input.count,
    });

    try {
      const generated = await this.engine.generate({
        chunks: chunked,
        count: input.count,
        type: input.type,
        difficulty: input.difficulty,
      });

      const stems = generated.items.map((item) => item.stem);
      const stemEmbeddings = stems.length > 0 ? await this.engine.embed(stems) : [];

      const persisted: QuestionDto[] = [];
      let acceptedByRubric = 0;

      for (const [index, item] of generated.items.entries()) {
        const rubricResult = this.rubric.evaluate(item, source.content);
        if (rubricResult.passed) {
          acceptedByRubric += 1;
        }

        const embedding = stemEmbeddings[index] ?? null;
        const duplicates = embedding ? await this.similarity.findDuplicates(embedding) : [];
        const nearest = duplicates[0] ?? null;

        const question = await this.questions.create({
          sourceId: source.id,
          generationRunId: run.id,
          stem: item.stem,
          originalStem: item.stem,
          type: asQuestionType(item.type),
          difficulty: item.difficulty,
          bloomLevel: asBloom(item.bloom_level),
          explanation: item.explanation,
          status: 'needs_review',
          rubricFindings: withDuplicateFinding(rubricResult.findings, nearest?.similarity, nearest?.questionId),
          embedding,
          duplicateOfId: nearest?.questionId ?? null,
          duplicateSimilarity: nearest?.similarity ?? null,
          choices: normalizeChoices(item),
        });
        persisted.push(toQuestionDto(question));
      }

      await this.runs.complete(run.id, {
        status: 'succeeded',
        generatedCount: generated.items.length,
        acceptedByRubricCount: acceptedByRubric,
        promptTokens: generated.prompt_tokens,
        completionTokens: generated.completion_tokens,
        costUsd: generated.cost_usd,
        latencyMs: generated.latency_ms,
        provider: generated.provider,
        model: generated.model,
        promptVersion: generated.prompt_version,
      });

      const fresh = await this.runs.findById(run.id);
      return {
        run: toGenerationRunDto(fresh ?? run),
        questions: persisted,
      };
    } catch (error) {
      await this.runs.complete(run.id, {
        status: 'failed',
        generatedCount: 0,
        acceptedByRubricCount: 0,
        promptTokens: 0,
        completionTokens: 0,
        costUsd: 0,
        latencyMs: 0,
        error: error instanceof Error ? error.message : 'unknown error',
      });
      throw error;
    }
  }
}

function normalizeChoices(item: EngineItem) {
  if (item.choices.length > 0) {
    return item.choices.map((choice, ordinal) => ({
      label: choice.label || CHOICE_LABELS[ordinal] || String(ordinal + 1),
      content: choice.content,
      isCorrect: choice.is_correct,
      rationale: choice.rationale,
      ordinal,
    }));
  }
  return [];
}

function asQuestionType(value: string): QuestionType {
  if (value === 'true_false' || value === 'short_answer' || value === 'multiple_choice') {
    return value;
  }
  return 'multiple_choice';
}

function asBloom(value: string): BloomLevel {
  const allowed: readonly BloomLevel[] = [
    'remember',
    'understand',
    'apply',
    'analyze',
    'evaluate',
    'create',
  ];
  return allowed.includes(value as BloomLevel) ? (value as BloomLevel) : 'understand';
}

function withDuplicateFinding(
  findings: RubricFinding[],
  similarity: number | undefined,
  otherId: string | undefined,
): RubricFinding[] {
  if (similarity === undefined || !otherId) {
    return findings;
  }
  return [
    ...findings,
    {
      code: 'near_duplicate',
      severity: 'warning',
      message: `Possible duplicate of question ${otherId} (similarity ${(similarity * 100).toFixed(0)}%).`,
    },
  ];
}
