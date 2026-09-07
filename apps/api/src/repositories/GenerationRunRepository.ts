import type { Transaction } from 'sequelize';
import { GenerationRun } from '../domain/models/GenerationRun.js';
import type { GenerationRunStatus } from '../domain/types.js';

export interface CreateGenerationRunRecord {
  sourceId: string;
  provider: string;
  model: string;
  promptVersion: string;
  requestedCount: number;
}

export class GenerationRunRepository {
  async create(input: CreateGenerationRunRecord, transaction?: Transaction): Promise<GenerationRun> {
    return GenerationRun.create(input, { transaction });
  }

  async findById(id: string): Promise<GenerationRun | null> {
    return GenerationRun.findByPk(id);
  }

  async listBySource(sourceId: string): Promise<GenerationRun[]> {
    return GenerationRun.findAll({
      where: { sourceId },
      order: [['createdAt', 'DESC']],
    });
  }

  async complete(
    id: string,
    values: {
      status: GenerationRunStatus;
      generatedCount: number;
      acceptedByRubricCount: number;
      promptTokens: number;
      completionTokens: number;
      costUsd: number;
      latencyMs: number;
      error?: string | null;
      provider?: string;
      model?: string;
      promptVersion?: string;
    },
  ): Promise<void> {
    await GenerationRun.update(values, { where: { id } });
  }
}
