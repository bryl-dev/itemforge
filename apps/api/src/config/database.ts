import fs from 'node:fs';
import path from 'node:path';
import { Sequelize } from 'sequelize';
import { env, isTest } from './env.js';

/**
 * The application targets Postgres in production but stays runnable on SQLite
 * with no infrastructure at all, so a reviewer can clone the repo and start it
 * without installing a database. Everything that genuinely differs between the
 * two dialects is isolated behind `SimilarityRepository`; the rest of the code
 * only ever sees a Sequelize instance.
 */
export function createSequelize(overrides: { storage?: string; logging?: boolean } = {}): Sequelize {
  const logging = overrides.logging ?? false;

  if (env.DB_DIALECT === 'postgres') {
    return new Sequelize(env.DATABASE_URL as string, {
      dialect: 'postgres',
      logging: logging ? console.log : false,
      dialectOptions: env.DATABASE_URL?.includes('localhost')
        ? {}
        : { ssl: { require: true, rejectUnauthorized: false } },
      pool: { max: 10, min: 0, idle: 10_000 },
    });
  }

  const storage = overrides.storage ?? (isTest ? ':memory:' : resolveSqliteStorage());

  return new Sequelize({
    dialect: 'sqlite',
    storage,
    logging: logging ? console.log : false,
  });
}

function resolveSqliteStorage(): string {
  const storage = path.isAbsolute(env.DB_STORAGE)
    ? env.DB_STORAGE
    : path.join(env.repoRoot, env.DB_STORAGE);

  fs.mkdirSync(path.dirname(storage), { recursive: true });
  return storage;
}

export const supportsPgVector = env.DB_DIALECT === 'postgres';
