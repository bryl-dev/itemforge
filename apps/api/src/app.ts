import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { createContext, type ContextOverrides } from './context.js';
import type { Database } from './db/index.js';
import { errorHandler, notFoundHandler } from './http/middleware/errorHandler.js';
import { exportRoutes } from './http/routes/export.js';
import { healthRoutes } from './http/routes/health.js';
import { metricsRoutes } from './http/routes/metrics.js';
import { questionRoutes } from './http/routes/questions.js';
import { sourceRoutes } from './http/routes/sources.js';

export function createApp(db: Database, overrides: ContextOverrides = {}): Express {
  const ctx = createContext(db, overrides);
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: env.WEB_ORIGIN, credentials: true }));
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.use('/api', healthRoutes(db));
  app.use('/api/sources', sourceRoutes(ctx));
  app.use('/api/questions', questionRoutes(ctx));
  app.use('/api/metrics', metricsRoutes(ctx));
  app.use('/api/export', exportRoutes(ctx));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
