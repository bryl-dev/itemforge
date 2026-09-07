import type { SourceStatus } from '../domain/types.js';
import { Source } from '../domain/models/Source.js';
import { SourceChunk } from '../domain/models/SourceChunk.js';

export interface CreateSourceRecord {
  title: string;
  courseCode?: string | null;
  content: string;
}

export class SourceRepository {
  async create(input: CreateSourceRecord): Promise<Source> {
    return Source.create({
      title: input.title,
      courseCode: input.courseCode ?? null,
      content: input.content,
    });
  }

  async findById(id: string): Promise<Source | null> {
    return Source.findByPk(id);
  }

  async list(): Promise<Source[]> {
    return Source.findAll({ order: [['createdAt', 'DESC']] });
  }

  async updateStatus(id: string, status: SourceStatus): Promise<void> {
    await Source.update({ status }, { where: { id } });
  }

  async delete(id: string): Promise<number> {
    return Source.destroy({ where: { id } });
  }
}

export interface CreateChunkRecord {
  sourceId: string;
  ordinal: number;
  content: string;
  embedding: number[] | null;
}

export class SourceChunkRepository {
  async replaceForSource(sourceId: string, chunks: CreateChunkRecord[]): Promise<SourceChunk[]> {
    await SourceChunk.destroy({ where: { sourceId } });
    if (chunks.length === 0) {
      return [];
    }
    return SourceChunk.bulkCreate(chunks);
  }

  async listBySource(sourceId: string): Promise<SourceChunk[]> {
    return SourceChunk.findAll({
      where: { sourceId },
      order: [['ordinal', 'ASC']],
    });
  }
}
