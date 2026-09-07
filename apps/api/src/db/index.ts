import type { Sequelize } from 'sequelize';
import { createSequelize } from '../config/database.js';
import { initializeModels, type Models } from '../domain/models/index.js';
import { createMigrator } from './migrator.js';

export interface Database {
  sequelize: Sequelize;
  models: Models;
  migrate(): Promise<void>;
  close(): Promise<void>;
}

export function createDatabase(
  options: { storage?: string; logging?: boolean } = {},
): Database {
  const sequelize = createSequelize(options);
  const models = initializeModels(sequelize);

  return {
    sequelize,
    models,
    async migrate() {
      await createMigrator(sequelize).up();
    },
    async close() {
      await sequelize.close();
    },
  };
}
