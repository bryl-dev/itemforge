import { z } from 'zod';
import {
  BLOOM_LEVELS,
  DIFFICULTIES,
  QUESTION_STATUSES,
  QUESTION_TYPES,
} from '../domain/types.js';

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export const createSourceSchema = z.object({
  title: z.string().trim().min(1).max(300),
  courseCode: z.string().trim().max(32).optional().nullable(),
  content: z.string().min(40, 'Source content must be at least 40 characters.'),
});

export type CreateSourceInput = z.infer<typeof createSourceSchema>;

export const listQuestionsQuerySchema = paginationQuerySchema.extend({
  status: z.enum(QUESTION_STATUSES).optional(),
  sourceId: z.string().uuid().optional(),
});

export type ListQuestionsQuery = z.infer<typeof listQuestionsQuerySchema>;

export const choiceInputSchema = z.object({
  label: z.string().min(1).max(8),
  content: z.string().min(1),
  isCorrect: z.boolean(),
  rationale: z.string().optional().nullable(),
  ordinal: z.number().int().min(0),
});

export const createQuestionSchema = z.object({
  sourceId: z.string().uuid().optional().nullable(),
  stem: z.string().min(1),
  type: z.enum(QUESTION_TYPES).default('multiple_choice'),
  difficulty: z.enum(DIFFICULTIES).default('medium'),
  bloomLevel: z.enum(BLOOM_LEVELS).default('understand'),
  explanation: z.string().optional().nullable(),
  choices: z.array(choiceInputSchema).min(2),
});

export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;

export const updateQuestionSchema = z.object({
  stem: z.string().min(1).optional(),
  explanation: z.string().optional().nullable(),
  difficulty: z.enum(DIFFICULTIES).optional(),
  bloomLevel: z.enum(BLOOM_LEVELS).optional(),
  type: z.enum(QUESTION_TYPES).optional(),
  choices: z.array(choiceInputSchema).min(2).optional(),
});

export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;

export const reviewActionSchema = z.object({
  actor: z.string().trim().min(1).max(120).optional(),
  note: z.string().trim().max(2000).optional().nullable(),
});

export type ReviewActionInput = z.infer<typeof reviewActionSchema>;

export const generateQuestionsSchema = z.object({
  count: z.coerce.number().int().min(1).max(20).default(6),
  type: z.enum(QUESTION_TYPES).default('multiple_choice'),
  difficulty: z.enum(DIFFICULTIES).optional(),
});

export type GenerateQuestionsInput = z.infer<typeof generateQuestionsSchema>;
