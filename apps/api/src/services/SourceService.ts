import { toSourceDto, type SourceDto } from '../domain/dto.js';
import { NotFoundError } from '../http/errors.js';
import type { CreateSourceInput } from '../http/schemas.js';
import { SourceRepository } from '../repositories/SourceRepository.js';

export class SourceService {
  constructor(private readonly sources: SourceRepository) {}

  async create(input: CreateSourceInput): Promise<SourceDto> {
    const source = await this.sources.create({
      title: input.title,
      courseCode: input.courseCode ?? null,
      content: input.content,
    });
    return toSourceDto(source);
  }

  async list(): Promise<SourceDto[]> {
    const sources = await this.sources.list();
    return sources.map(toSourceDto);
  }

  async get(id: string): Promise<SourceDto> {
    const source = await this.sources.findById(id);
    if (!source) {
      throw new NotFoundError('Source', id);
    }
    return toSourceDto(source);
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.sources.delete(id);
    if (deleted === 0) {
      throw new NotFoundError('Source', id);
    }
  }
}
