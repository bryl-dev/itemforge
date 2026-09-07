import type { Express } from 'express';
import { createApp } from '../src/app.js';
import type { ContextOverrides } from '../src/context.js';
import { createDatabase, type Database } from '../src/db/index.js';

export { sampleChoices, sampleSource } from '../src/domain/demo.js';

const TABLES = [
  'review_events',
  'choices',
  'questions',
  'generation_runs',
  'source_chunks',
  'sources',
];

let sharedDb: Database | null = null;

/**
 * One in-memory database per Vitest process. Tables are emptied between tests
 * so files can share the model registry without leaking rows. A new Express
 * app is created each call so tests can inject a fake AI engine.
 */
export async function getTestApp(
  overrides: ContextOverrides = {},
): Promise<{ db: Database; app: Express }> {
  if (!sharedDb) {
    sharedDb = createDatabase({ storage: ':memory:' });
    await sharedDb.migrate();
  } else {
    await emptyTables(sharedDb);
  }
  return { db: sharedDb, app: createApp(sharedDb, overrides) };
}

async function emptyTables(db: Database): Promise<void> {
  for (const table of TABLES) {
    await db.sequelize.query(`DELETE FROM ${table}`);
  }
}
