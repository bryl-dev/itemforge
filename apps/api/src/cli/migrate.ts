import { createSequelize } from '../config/database.js';
import { createMigrator } from '../db/migrator.js';
import { initializeModels } from '../domain/models/index.js';

const direction = process.argv[2] ?? 'up';

async function main(): Promise<void> {
  const sequelize = createSequelize({ logging: false });
  initializeModels(sequelize);
  const migrator = createMigrator(sequelize);

  if (direction === 'down') {
    await migrator.down();
  } else {
    const executed = await migrator.up();
    if (executed.length === 0) {
      console.log('No pending migrations.');
    }
  }

  await sequelize.close();
}

main().catch((error: unknown) => {
  console.error('Migration failed:', error);
  process.exitCode = 1;
});
