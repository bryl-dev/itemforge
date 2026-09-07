import { config as loadDotenv } from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';

/**
 * Walks up from cwd looking for the monorepo root. Using the filesystem rather
 * than `import.meta.url` keeps this correct both when running from `src/` via
 * tsx and when running compiled `dist/` inside a Docker image.
 */
function findRepoRoot(): string {
  let dir = process.cwd();
  for (let i = 0; i < 8; i += 1) {
    const hasWorkspace = fs.existsSync(path.join(dir, 'package.json'));
    const hasApps = fs.existsSync(path.join(dir, 'apps'));
    if (hasWorkspace && hasApps) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      break;
    }
    dir = parent;
  }
  return process.cwd();
}

const repoRoot = findRepoRoot();

loadDotenv({ path: path.join(repoRoot, '.env') });

/**
 * Environment is parsed once, at startup, into a frozen typed object.
 * Nothing else in the codebase touches `process.env`, so a missing or
 * malformed variable fails immediately and loudly rather than surfacing
 * as `undefined` deep inside a request handler.
 */
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().positive().default(4000),
  WEB_ORIGIN: z.string().default('http://localhost:5173'),

  DB_DIALECT: z.enum(['sqlite', 'postgres']).default('sqlite'),
  DB_STORAGE: z.string().default('./data/itemforge.sqlite'),
  DATABASE_URL: z.string().optional(),

  AI_ENGINE_URL: z.string().url().default('http://localhost:8000'),
  AI_ENGINE_TIMEOUT_MS: z.coerce.number().int().positive().default(60_000),

  DUPLICATE_SIMILARITY_THRESHOLD: z.coerce.number().min(0).max(1).default(0.88),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
    .join('\n');
  throw new Error(`Invalid environment configuration:\n${issues}`);
}

export type AppEnv = z.infer<typeof schema> & { repoRoot: string };

export const env: Readonly<AppEnv> = Object.freeze({
  ...parsed.data,
  repoRoot,
});

if (env.DB_DIALECT === 'postgres' && !env.DATABASE_URL) {
  throw new Error('DB_DIALECT=postgres requires DATABASE_URL to be set.');
}

export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
