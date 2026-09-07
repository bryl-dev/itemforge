import type { DuplicateMatch } from '../../domain/types.js';

export interface SimilarityIndex {
  findDuplicates(embedding: number[], excludeId?: string): Promise<DuplicateMatch[]>;
}

export class NoopSimilarityIndex implements SimilarityIndex {
  async findDuplicates(_embedding: number[], _excludeId?: string): Promise<DuplicateMatch[]> {
    return [];
  }
}
