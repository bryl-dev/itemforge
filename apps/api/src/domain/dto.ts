import type { Choice } from './models/Choice.js';
import type { GenerationRun } from './models/GenerationRun.js';
import type { Question } from './models/Question.js';
import type { ReviewEvent } from './models/ReviewEvent.js';
import type { Source } from './models/Source.js';
import type { SourceChunk } from './models/SourceChunk.js';

export interface SourceDto {
  id: string;
  title: string;
  courseCode: string | null;
  content: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface SourceChunkDto {
  id: string;
  ordinal: number;
  content: string;
}

export interface ChoiceDto {
  id: string;
  label: string;
  content: string;
  isCorrect: boolean;
  rationale: string | null;
  ordinal: number;
}

export interface QuestionDto {
  id: string;
  sourceId: string | null;
  generationRunId: string | null;
  stem: string;
  originalStem: string;
  type: string;
  difficulty: string;
  bloomLevel: string;
  explanation: string | null;
  status: string;
  rubricFindings: unknown;
  duplicateOfId: string | null;
  duplicateSimilarity: number | null;
  choices: ChoiceDto[];
  createdAt: string;
  updatedAt: string;
}

export interface GenerationRunDto {
  id: string;
  sourceId: string;
  provider: string;
  model: string;
  promptVersion: string;
  requestedCount: number;
  generatedCount: number;
  acceptedByRubricCount: number;
  promptTokens: number;
  completionTokens: number;
  costUsd: number;
  latencyMs: number;
  status: string;
  error: string | null;
  createdAt: string;
}

export interface ReviewEventDto {
  id: string;
  questionId: string;
  action: string;
  actor: string;
  fromStatus: string | null;
  toStatus: string | null;
  stemBefore: string | null;
  stemAfter: string | null;
  editDistance: number | null;
  note: string | null;
  createdAt: string;
}

export interface Metrics {
  questionsTotal: number;
  reviewedTotal: number;
  acceptedTotal: number;
  rejectedTotal: number;
  acceptanceRate: number | null;
  medianEditDistance: number | null;
  duplicateRate: number | null;
  costPerAcceptedUsd: number | null;
  rubricErrorRate: number | null;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export function toSourceDto(source: Source): SourceDto {
  return {
    id: source.id,
    title: source.title,
    courseCode: source.courseCode,
    content: source.content,
    status: source.status,
    createdAt: source.createdAt.toISOString(),
    updatedAt: source.updatedAt.toISOString(),
  };
}

export function toChunkDto(chunk: SourceChunk): SourceChunkDto {
  return {
    id: chunk.id,
    ordinal: chunk.ordinal,
    content: chunk.content,
  };
}

export function toChoiceDto(choice: Choice): ChoiceDto {
  return {
    id: choice.id,
    label: choice.label,
    content: choice.content,
    isCorrect: choice.isCorrect,
    rationale: choice.rationale,
    ordinal: choice.ordinal,
  };
}

export function toQuestionDto(question: Question): QuestionDto {
  const choices = [...(question.choices ?? [])].sort((a, b) => a.ordinal - b.ordinal);
  return {
    id: question.id,
    sourceId: question.sourceId,
    generationRunId: question.generationRunId,
    stem: question.stem,
    originalStem: question.originalStem,
    type: question.type,
    difficulty: question.difficulty,
    bloomLevel: question.bloomLevel,
    explanation: question.explanation,
    status: question.status,
    rubricFindings: question.rubricFindings,
    duplicateOfId: question.duplicateOfId,
    duplicateSimilarity: question.duplicateSimilarity,
    choices: choices.map(toChoiceDto),
    createdAt: question.createdAt.toISOString(),
    updatedAt: question.updatedAt.toISOString(),
  };
}

export function toGenerationRunDto(run: GenerationRun): GenerationRunDto {
  return {
    id: run.id,
    sourceId: run.sourceId,
    provider: run.provider,
    model: run.model,
    promptVersion: run.promptVersion,
    requestedCount: run.requestedCount,
    generatedCount: run.generatedCount,
    acceptedByRubricCount: run.acceptedByRubricCount,
    promptTokens: run.promptTokens,
    completionTokens: run.completionTokens,
    costUsd: run.costUsd,
    latencyMs: run.latencyMs,
    status: run.status,
    error: run.error,
    createdAt: run.createdAt.toISOString(),
  };
}

export function toReviewEventDto(event: ReviewEvent): ReviewEventDto {
  return {
    id: event.id,
    questionId: event.questionId,
    action: event.action,
    actor: event.actor,
    fromStatus: event.fromStatus,
    toStatus: event.toStatus,
    stemBefore: event.stemBefore,
    stemAfter: event.stemAfter,
    editDistance: event.editDistance,
    note: event.note,
    createdAt: event.createdAt.toISOString(),
  };
}
