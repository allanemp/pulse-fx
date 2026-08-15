import { buildApp, buildIndicatorSyncWorker } from './composition-root.js';
import { env } from './infrastructure/config/env.js';
import { prisma } from './infrastructure/database/prisma/client.js';
import { logger } from './infrastructure/logging/logger.js';
import { indicatorSyncQueue } from './infrastructure/queue/indicatorSyncQueue.js';
import { redisConnection } from './infrastructure/queue/redisConnection.js';
import { scheduleDailyIndicatorSync } from './infrastructure/queue/scheduleDailyIndicatorSync.js';

const app = buildApp();
const indicatorSyncWorker = buildIndicatorSyncWorker();

const server = app.listen(env.PORT, () => {
  logger.info(`Pulse FX API ouvindo na porta ${env.PORT} (${env.NODE_ENV})`);
});

scheduleDailyIndicatorSync().catch((error: unknown) => {
  logger.error({ err: error }, 'Falha ao agendar a sincronização diária de indicadores');
});

async function shutdown(signal: string): Promise<void> {
  logger.info(`Recebido ${signal}, encerrando graciosamente...`);

  server.close(async () => {
    await indicatorSyncWorker.close();
    await indicatorSyncQueue.close();
    redisConnection.disconnect();
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
