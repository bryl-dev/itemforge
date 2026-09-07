import { createApp } from './app.js';
import { env } from './config/env.js';
import { createDatabase } from './db/index.js';

async function main(): Promise<void> {
  const db = createDatabase();

  await db.sequelize.authenticate();
  await db.migrate();

  const app = createApp(db);

  const server = app.listen(env.API_PORT, () => {
    console.log(`ItemForge API listening on http://localhost:${env.API_PORT}`);
    console.log(`  dialect:   ${env.DB_DIALECT}`);
    console.log(`  ai engine: ${env.AI_ENGINE_URL}`);
  });

  const shutdown = (signal: string): void => {
    console.log(`\n${signal} received, shutting down.`);
    server.close(() => {
      void db.close().then(() => process.exit(0));
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((error: unknown) => {
  console.error('Failed to start API:', error);
  process.exit(1);
});
