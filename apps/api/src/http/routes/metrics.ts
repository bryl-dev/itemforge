import { Router } from 'express';
import type { AppContext } from '../../context.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

export function metricsRoutes(ctx: AppContext): Router {
  const router = Router();
  router.get(
    '/',
    asyncHandler(async (_req, res) => {
      const metrics = await ctx.metrics.collect();
      res.json(metrics);
    }),
  );
  return router;
}
