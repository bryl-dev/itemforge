import fs from 'node:fs';
import path from 'node:path';
import { env } from '../config/env.js';
import { createSequelize } from '../config/database.js';
import { createMigrator } from '../db/migrator.js';
import { initializeModels } from '../domain/models/index.js';

/**
 * Drops everything and re-migrates. On SQLite the fastest correct reset is to
 * delete the file, since dropping tables leaves enum/check artifacts behind.
 */
async function main(): Promise<void> {
  if (env.DB_DIALECT === 'sqlite') {
    const storage = path.isAbsolute(env.DB_STORAGE)
      ? env.DB_STORAGE
      : path.join(env.repoRoot, env.DB_STORAGE);

    if (fs.existsSync(storage)) {
      fs.rmSync(storage);
      console.log(`Removed ${storage}`);
    }
  }

  const sequelize = createSequelize({ logging: false });
  initializeModels(sequelize);

  if (env.DB_DIALECT === 'postgres') {
    await sequelize.getQueryInterface().dropAllTables();
    await sequelize.query('DROP TABLE IF EXISTS schema_migrations');
  }

  await createMigrator(sequelize).up();
  await sequelize.close();
  console.log('Database reset and migrated.');
}

main().catch((error: unknown) => {
  console.error('Reset failed:', error);
  process.exitCode = 1;
});
