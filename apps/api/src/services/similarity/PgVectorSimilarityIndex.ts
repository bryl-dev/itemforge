import { env } from '../../config/env.js';
import type { DuplicateMatch } from '../../domain/types.js';
import { Question } from '../../domain/models/Question.js';
import type { SimilarityIndex } from './SimilarityIndex.js';

/**
 * Indexed cosine search against a `vector` column. Only constructed when the
 * dialect is Postgres and the pgvector extension is available. The in-process
 * index remains the default because embedding dimensionality follows the
 * provider (64 for the fixture, 1536 for text-embedding-3-small).
 */
export class PgVectorSimilarityIndex implements SimilarityIndex {
  constructor(
    private readonly threshold: number = env.DUPLICATE_SIMILARITY_THRESHOLD,
  ) {}

  async findDuplicates(embedding: number[], excludeId?: string): Promise<DuplicateMatch[]> {
    const sequelize = Question.sequelize;
    if (!sequelize) {
      return [];
    }
    const literal = `[${embedding.join(',')}]`;
    const rows = (await sequelize.query(
      `
        SELECT id, stem, 1 - (embedding_vec <=> CAST(:vec AS vector)) AS similarity
        FROM questions
        WHERE embedding_vec IS NOT NULL
          AND status <> 'rejected'
          AND (:excludeId IS NULL OR id <> :excludeId)
          AND 1 - (embedding_vec <=> CAST(:vec AS vector)) >= :threshold
        ORDER BY embedding_vec <=> CAST(:vec AS vector)
        LIMIT 5
      `,
      {
        replacements: { vec: literal, excludeId: excludeId ?? null, threshold: this.threshold },
      },
    )) as unknown as Array<{ id: string; stem: string; similarity: number }>[];

    const records = Array.isArray(rows[0]) ? rows[0] : [];
    return records.map((row) => ({
      questionId: row.id,
      stem: row.stem,
      similarity: Number(row.similarity),
    }));
  }
}
