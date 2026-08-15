import { INDICATOR_SYNC_JOB_NAMES, indicatorSyncQueue } from './indicatorSyncQueue.js';

const DAILY_SYNC_SCHEDULER_ID = 'daily-indicator-sync';

/**
 * Garante que o job "dispare a sincronização de todos os indicadores" rode
 * todo dia às 18h, horário de Brasília. `upsertJobScheduler` é idempotente
 * por design — chamar de novo a cada boot da API (ver `server.ts`) só
 * substitui a definição existente, nunca duplica o agendamento.
 */
export async function scheduleDailyIndicatorSync(): Promise<void> {
  await indicatorSyncQueue.upsertJobScheduler(
    DAILY_SYNC_SCHEDULER_ID,
    { pattern: '0 18 * * *', tz: 'America/Sao_Paulo' },
    { name: INDICATOR_SYNC_JOB_NAMES.DAILY_TRIGGER, data: {} },
  );
}
