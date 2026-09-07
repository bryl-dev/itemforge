import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { QueryInterface, Sequelize } from 'sequelize';
import { SequelizeStorage, Umzug } from 'umzug';

const here = path.dirname(fileURLToPath(import.meta.url));

export interface MigrationContext {
  queryInterface: QueryInterface;
  sequelize: Sequelize;
}

export type Migration = {
  up: (ctx: MigrationContext) => Promise<void>;
  down: (ctx: MigrationContext) => Promise<void>;
};

/**
 * Migrations are TypeScript modules run by Umzug rather than sequelize-cli's
 * JavaScript files, so schema changes are type-checked alongside the models
 * they support and can be executed in-process by the test suite.
 */
export function createMigrator(sequelize: Sequelize): Umzug<MigrationContext> {
  return new Umzug({
    migrations: {
      glob: ['../migrations/*.{ts,js}', { cwd: here }],
      resolve: ({ name, path: filepath, context }) => ({
        name,
        up: async () => {
          const migration = (await import(pathToUrl(filepath as string))) as Migration;
          return migration.up(context);
        },
        down: async () => {
          const migration = (await import(pathToUrl(filepath as string))) as Migration;
          return migration.down(context);
        },
      }),
    },
    context: { queryInterface: sequelize.getQueryInterface(), sequelize },
    storage: new SequelizeStorage({ sequelize, tableName: 'schema_migrations' }),
    logger: process.env.NODE_ENV === 'test' ? undefined : console,
  });
}

function pathToUrl(filepath: string): string {
  return new URL(`file://${filepath.replace(/\\/g, '/')}`).href;
}
