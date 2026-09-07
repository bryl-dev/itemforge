import { Router } from 'express';
import { z } from 'zod';
import type { AppContext } from '../../context.js';
import { toGift } from '../../services/gift.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const querySchema = z.object({
  sourceId: z.string().uuid().optional(),
});

export function exportRoutes(ctx: AppContext): Router {
  const router = Router();

  router.get(
    '/gift',
    asyncHandler(async (req, res) => {
      const query = querySchema.parse(req.query);
      const { rows } = await ctx.questionRepo.list({
        status: 'approved',
        sourceId: query.sourceId,
        page: 1,
        pageSize: 500,
      });
      res.setHeader('content-type', 'text/plain; charset=utf-8');
      res.setHeader('content-disposition', 'attachment; filename="itemforge-bank.gift"');
      res.send(toGift(rows));
    }),
  );

  return router;
}
