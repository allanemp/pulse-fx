import type { Redis } from 'ioredis';
import { logger } from '../logging/logger.js';
import type { Cache } from './Cache.js';

/**
 * Implementação de `Cache` sobre Redis — valores serializados como JSON.
 *
 * Falha de cache (Redis fora do ar, JSON inválido etc.) nunca deve derrubar
 * a requisição: cache é uma otimização, não uma fonte de verdade. `get`
 * devolve `null` (equivalente a "cache miss") e `set`/`delByPrefix` engolem
 * o erro, só logando — quem chama segue pro banco normalmente.
 */
export class RedisCache implements Cache {
  constructor(private readonly redis: Redis) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await this.redis.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch (error) {
      logger.warn({ err: error, key }, '[cache] Falha ao ler do Redis, seguindo sem cache');
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    try {
      await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (error) {
      logger.warn({ err: error, key }, '[cache] Falha ao escrever no Redis');
    }
  }

  async delByPrefix(prefix: string): Promise<void> {
    try {
      const keysToDelete: string[] = [];
      let cursor = '0';

      // SCAN em vez de KEYS: itera em lotes sem bloquear o Redis, mesmo com
      // muitas chaves (o BullMQ já usa o mesmo Redis pra fila/jobs).
      do {
        const [nextCursor, keys] = await this.redis.scan(
          cursor,
          'MATCH',
          `${prefix}*`,
          'COUNT',
          100,
        );
        cursor = nextCursor;
        keysToDelete.push(...keys);
      } while (cursor !== '0');

      if (keysToDelete.length > 0) {
        await this.redis.del(...keysToDelete);
      }
    } catch (error) {
      logger.warn({ err: error, prefix }, '[cache] Falha ao invalidar chaves no Redis');
    }
  }
}
