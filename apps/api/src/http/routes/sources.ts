import { Router } from 'express';
import type { AppContext } from '../../context.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { createSourceSchema, generateQuestionsSchema } from '../schemas.js';

export function sourceRoutes(ctx: AppContext): Router {
  const router = Router();

  router.get(
    '/',
    asyncHandler(async (_req, res) => {
      const sources = await ctx.sources.list();
      res.json({ items: sources });
    }),
  );

  router.post(
    '/',
    asyncHandler(async (req, res) => {
      const input = createSourceSchema.parse(req.body);
      const source = await ctx.sources.create(input);
      res.status(201).json(source);
    }),
  );

  router.post(
    '/:id/generate',
    asyncHandler(async (req, res) => {
      const input = generateQuestionsSchema.parse(req.body ?? {});
      const result = await ctx.generation.generate(req.params.id as string, input);
      res.status(201).json(result);
    }),
  );

  router.get(
    '/:id',
    asyncHandler(async (req, res) => {
      const source = await ctx.sources.get(req.params.id as string);
      res.json(source);
    }),
  );

  router.delete(
    '/:id',
    asyncHandler(async (req, res) => {
      await ctx.sources.remove(req.params.id as string);
      res.status(204).send();
    }),
  );

  return router;
}
