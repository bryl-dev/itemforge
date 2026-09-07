import { Router } from 'express';
import type { Database } from '../../db/index.js';
import { env } from '../../config/env.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

interface DependencyStatus {
  status: 'ok' | 'degraded' | 'down';
  detail?: string;
}

/**
 * Reports the health of each dependency separately. The AI engine being down is
 * reported as `degraded` rather than failing the whole check, because the bank,
 * the review queue and export all keep working without it.
 */
export function healthRoutes(db: Database): Router {
  const router = Router();

  router.get(
    '/health',
    asyncHandler(async (_req, res) => {
      const [database, aiEngine] = await Promise.all([checkDatabase(db), checkAiEngine()]);

      const healthy = database.status === 'ok';

      res.status(healthy ? 200 : 503).json({
        status: healthy ? (aiEngine.status === 'ok' ? 'ok' : 'degraded') : 'down',
        version: process.env.npm_package_version ?? '0.1.0',
        dialect: env.DB_DIALECT,
        dependencies: { database, aiEngine },
      });
    }),
  );

  return router;
}

async function checkDatabase(db: Database): Promise<DependencyStatus> {
  try {
    await db.sequelize.authenticate();
    return { status: 'ok' };
  } catch (error) {
    return { status: 'down', detail: error instanceof Error ? error.message : 'unknown' };
  }
}

async function checkAiEngine(): Promise<DependencyStatus> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3_000);

  try {
    const response = await fetch(`${env.AI_ENGINE_URL}/health`, { signal: controller.signal });
    return response.ok
      ? { status: 'ok' }
      : { status: 'degraded', detail: `engine returned ${response.status}` };
  } catch {
    return { status: 'degraded', detail: 'engine unreachable' };
  } finally {
    clearTimeout(timeout);
  }
}
