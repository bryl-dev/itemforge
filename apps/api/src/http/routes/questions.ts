import { Router } from 'express';
import type { AppContext } from '../../context.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import {
  createQuestionSchema,
  listQuestionsQuerySchema,
  reviewActionSchema,
  updateQuestionSchema,
} from '../schemas.js';

export function questionRoutes(ctx: AppContext): Router {
  const router = Router();

  router.post(
    '/',
    asyncHandler(async (req, res) => {
      const input = createQuestionSchema.parse(req.body);
      const question = await ctx.questions.create(input);
      res.status(201).json(question);
    }),
  );

  router.get(
    '/',
    asyncHandler(async (req, res) => {
      const query = listQuestionsQuerySchema.parse(req.query);
      const page = await ctx.questions.list(query);
      res.json(page);
    }),
  );

  router.get(
    '/:id',
    asyncHandler(async (req, res) => {
      const question = await ctx.questions.get(req.params.id as string);
      res.json(question);
    }),
  );

  router.get(
    '/:id/events',
    asyncHandler(async (req, res) => {
      const events = await ctx.questions.history(req.params.id as string);
      res.json({ items: events });
    }),
  );

  router.patch(
    '/:id',
    asyncHandler(async (req, res) => {
      const input = updateQuestionSchema.parse(req.body);
      const question = await ctx.questions.update(req.params.id as string, input);
      res.json(question);
    }),
  );

  router.post(
    '/:id/approve',
    asyncHandler(async (req, res) => {
      const input = reviewActionSchema.parse(req.body ?? {});
      const question = await ctx.questions.approve(req.params.id as string, input);
      res.json(question);
    }),
  );

  router.post(
    '/:id/reject',
    asyncHandler(async (req, res) => {
      const input = reviewActionSchema.parse(req.body ?? {});
      const question = await ctx.questions.reject(req.params.id as string, input);
      res.json(question);
    }),
  );

  router.post(
    '/:id/reopen',
    asyncHandler(async (req, res) => {
      const input = reviewActionSchema.parse(req.body ?? {});
      const question = await ctx.questions.reopen(req.params.id as string, input);
      res.json(question);
    }),
  );

  router.delete(
    '/:id',
    asyncHandler(async (req, res) => {
      await ctx.questions.remove(req.params.id as string);
      res.status(204).send();
    }),
  );

  return router;
}
