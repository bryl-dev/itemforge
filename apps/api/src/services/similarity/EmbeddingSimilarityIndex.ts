import { env } from '../../config/env.js';
import type { DuplicateMatch } from '../../domain/types.js';
import { cosineSimilarity } from '../../domain/vector.js';
import { QuestionRepository } from '../../repositories/QuestionRepository.js';
import type { SimilarityIndex } from './SimilarityIndex.js';

/**
 * Provider-agnostic near-duplicate search. Embeddings are stored as JSON so
 * the same code path works on SQLite and Postgres; dimensionality is whatever
 * the current provider emits. When a production model is frozen, this can be
 * swapped for an indexed pgvector implementation without touching callers.
 */
export class EmbeddingSimilarityIndex implements SimilarityIndex {
  constructor(
    private readonly questions: QuestionRepository,
    private readonly threshold: number = env.DUPLICATE_SIMILARITY_THRESHOLD,
  ) {}

  async findDuplicates(embedding: number[], excludeId?: string): Promise<DuplicateMatch[]> {
    const others = await this.questions.listWithEmbeddings(excludeId);
    return others
      .map((question) => ({
        questionId: question.id,
        stem: question.stem,
        similarity: cosineSimilarity(embedding, question.embedding),
      }))
      .filter((match) => match.similarity >= this.threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5);
  }
}
