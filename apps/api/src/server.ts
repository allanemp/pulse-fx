import { buildApp } from './composition-root.js';
import { env } from './infrastructure/config/env.js';
import { prisma } from './infrastructure/database/prisma/client.js';
import { logger } from './infrastructure/logging/logger.js';

const app = buildApp();

const server = app.listen(env.PORT, () => {
  logger.info(`Pulse FX API ouvindo na porta ${env.PORT} (${env.NODE_ENV})`);
});

async function shutdown(signal: string): Promise<void> {
  logger.info(`Recebido ${signal}, encerrando graciosamente...`);

  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
