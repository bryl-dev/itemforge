import { env } from '../config/env.js';
import { UpstreamError } from '../http/errors.js';
import type { Difficulty, QuestionType } from '../domain/types.js';

export interface EngineChunk {
  ordinal: number;
  content: string;
}

export interface EngineChoice {
  label: string;
  content: string;
  is_correct: boolean;
  rationale: string | null;
}

export interface EngineItem {
  stem: string;
  type: QuestionType;
  difficulty: Difficulty;
  bloom_level: string;
  explanation: string | null;
  choices: EngineChoice[];
  source_chunk_ordinal: number;
}

export interface EngineGenerateResult {
  items: EngineItem[];
  provider: string;
  model: string;
  prompt_version: string;
  prompt_tokens: number;
  completion_tokens: number;
  cost_usd: number;
  latency_ms: number;
}

export interface AiEngine {
  chunk(text: string): Promise<EngineChunk[]>;
  generate(input: {
    chunks: EngineChunk[];
    count: number;
    type: QuestionType;
    difficulty?: Difficulty;
  }): Promise<EngineGenerateResult>;
  embed(texts: string[]): Promise<number[][]>;
}

export class HttpAiEngineClient implements AiEngine {
  constructor(
    private readonly baseUrl: string = env.AI_ENGINE_URL,
    private readonly timeoutMs: number = env.AI_ENGINE_TIMEOUT_MS,
  ) {}

  async chunk(text: string): Promise<EngineChunk[]> {
    const body = await this.post<{ chunks: EngineChunk[] }>('/v1/chunk', { text });
    return body.chunks;
  }

  async generate(input: {
    chunks: EngineChunk[];
    count: number;
    type: QuestionType;
    difficulty?: Difficulty;
  }): Promise<EngineGenerateResult> {
    return this.post<EngineGenerateResult>('/v1/generate', input);
  }

  async embed(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) {
      return [];
    }
    const body = await this.post<{ embeddings: number[][] }>('/v1/embed', { texts });
    return body.embeddings;
  }

  private async post<T>(path: string, payload: unknown): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      if (!response.ok) {
        const detail = await response.text();
        throw new UpstreamError(`AI engine returned ${response.status} for ${path}.`, detail);
      }
      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof UpstreamError) {
        throw error;
      }
      throw new UpstreamError(
        `AI engine is unreachable at ${this.baseUrl}.`,
        error instanceof Error ? error.message : error,
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}
