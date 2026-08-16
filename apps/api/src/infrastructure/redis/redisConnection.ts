import { Redis } from 'ioredis';
import { env } from '../config/env.js';
import { logger } from '../logging/logger.js';

/**
 * Conexão Redis única do processo, compartilhada pela fila/worker do BullMQ
 * e pelo cache (`infrastructure/cache`) — uma só instância, um só lugar
 * pra fechar no shutdown, em vez de uma conexão por consumidor.
 * `maxRetriesPerRequest: null` é exigido pelo BullMQ — sem isso, comandos
 * bloqueantes usados internamente pela lib podem falhar silenciosamente.
 */
export const redisConnection = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

redisConnection.on('error', (error: Error) => {
  logger.error({ err: error }, '[redis] Erro de conexão');
});
