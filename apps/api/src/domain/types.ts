export const QUESTION_STATUSES = ['draft', 'needs_review', 'approved', 'rejected'] as const;
export type QuestionStatus = (typeof QUESTION_STATUSES)[number];

export const QUESTION_TYPES = ['multiple_choice', 'true_false', 'short_answer'] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export const BLOOM_LEVELS = [
  'remember',
  'understand',
  'apply',
  'analyze',
  'evaluate',
  'create',
] as const;
export type BloomLevel = (typeof BLOOM_LEVELS)[number];

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

/**
 * Every transition a question makes after it leaves the generator is recorded
 * as one of these. The metrics layer is derived entirely from this log, which
 * is why the vocabulary is deliberately small and closed.
 */
export const REVIEW_ACTIONS = ['approved', 'rejected', 'edited', 'reopened'] as const;
export type ReviewAction = (typeof REVIEW_ACTIONS)[number];

export const SOURCE_STATUSES = ['pending', 'chunked', 'failed'] as const;
export type SourceStatus = (typeof SOURCE_STATUSES)[number];

export const GENERATION_RUN_STATUSES = ['running', 'succeeded', 'failed'] as const;
export type GenerationRunStatus = (typeof GENERATION_RUN_STATUSES)[number];

export type RubricSeverity = 'error' | 'warning';

/**
 * A single rubric violation. `code` is stable and machine-readable so the UI can
 * group findings and the metrics layer can count them over time; `message` is
 * written for the educator reading the review queue, not for a developer.
 */
export interface RubricFinding {
  code: string;
  severity: RubricSeverity;
  message: string;
}

export interface RubricResult {
  /** False when at least one finding has severity `error`. */
  passed: boolean;
  findings: RubricFinding[];
}

export interface DuplicateMatch {
  questionId: string;
  similarity: number;
  stem: string;
}
