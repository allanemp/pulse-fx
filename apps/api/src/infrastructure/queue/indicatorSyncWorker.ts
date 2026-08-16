import { Worker, type Job } from 'bullmq';
import type { ListSyncableIndicatorIds } from '../../application/use-cases/ListSyncableIndicatorIds.js';
import type {
  SyncIndicatorObservationsInput,
  SyncIndicatorObservationsResult,
} from '../../application/use-cases/SyncIndicatorObservations.js';
import { logger } from '../logging/logger.js';
import {
  INDICATOR_SYNC_JOB_NAMES,
  INDICATOR_SYNC_QUEUE_NAME,
  indicatorSyncQueue,
} from './indicatorSyncQueue.js';
import { redisConnection } from '../redis/redisConnection.js';

/** Ver o comentário equivalente em `IndicatorController.ts`: tipado pelo formato de `execute`, não pela classe concreta. */
interface SyncIndicatorObservationsUseCase {
  execute(input: SyncIndicatorObservationsInput): Promise<SyncIndicatorObservationsResult>;
}

export interface IndicatorSyncWorkerDeps {
  listSyncableIndicatorIds: ListSyncableIndicatorIds;
  syncIndicatorObservations: SyncIndicatorObservationsUseCase;
}

/**
 * Processa a fila com `concurrency: 1` de propósito: um indicador por vez,
 * para a fonte externa (SGS/BCB) nunca receber requisições simultâneas
 * disparadas pelo mesmo job diário.
 */
export function createIndicatorSyncWorker(deps: IndicatorSyncWorkerDeps): Worker {
  const worker = new Worker(
    INDICATOR_SYNC_QUEUE_NAME,
    async (job: Job) => {
      if (job.name === INDICATOR_SYNC_JOB_NAMES.DAILY_TRIGGER) {
        const indicatorIds = await deps.listSyncableIndicatorIds.execute();

        await indicatorSyncQueue.addBulk(
          indicatorIds.map((indicatorId) => ({
            name: INDICATOR_SYNC_JOB_NAMES.SYNC_INDICATOR,
            data: { indicatorId },
          })),
        );

        logger.info(
          `[indicator-sync] Disparo diário: ${indicatorIds.length} indicador(es) enfileirado(s).`,
        );
        return;
      }

      if (job.name === INDICATOR_SYNC_JOB_NAMES.SYNC_INDICATOR) {
        const { indicatorId } = job.data as { indicatorId: string };
        const result = await deps.syncIndicatorObservations.execute({ indicatorId });

        logger.info(
          `[indicator-sync] Indicador ${result.indicatorId}: ${result.observationsSynced} observações sincronizadas.`,
        );
        return;
      }

      logger.warn(`[indicator-sync] Job desconhecido: "${job.name}".`);
    },
    { connection: redisConnection, concurrency: 1 },
  );

  worker.on('error', (error) => {
    logger.error({ err: error }, '[indicator-sync] Erro no worker');
  });

  worker.on('failed', (job, error) => {
    logger.error({ err: error, jobId: job?.id, jobName: job?.name }, '[indicator-sync] Job falhou');
  });

  return worker;
}
