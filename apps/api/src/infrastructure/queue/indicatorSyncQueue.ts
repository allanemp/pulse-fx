import { Queue } from 'bullmq';
import { logger } from '../logging/logger.js';
import { redisConnection } from '../redis/redisConnection.js';

export const INDICATOR_SYNC_QUEUE_NAME = 'indicator-sync';

/**
 * Dois tipos de job nesta fila (ver `indicatorSyncWorker.ts`):
 * - `DAILY_TRIGGER`: agendado (cron), não busca dado nenhum — só enfileira
 *   um `SYNC_INDICATOR` para cada indicador sincronizável.
 * - `SYNC_INDICATOR`: sincroniza as observações de um indicador.
 */
export const INDICATOR_SYNC_JOB_NAMES = {
  DAILY_TRIGGER: 'daily-trigger',
  SYNC_INDICATOR: 'sync-indicator',
} as const;

export const indicatorSyncQueue = new Queue(INDICATOR_SYNC_QUEUE_NAME, {
  connection: redisConnection,
});

indicatorSyncQueue.on('error', (error) => {
  logger.error({ err: error }, '[indicator-sync] Erro na fila');
});
