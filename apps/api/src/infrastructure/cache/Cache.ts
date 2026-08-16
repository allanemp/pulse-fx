/**
 * Porta de cache — abstrai Redis por trás de get/set/delByPrefix, pros
 * decorators (`CachedQuery`, `CacheInvalidatingCommand`) não dependerem
 * diretamente do ioredis. Só existe implementação (`RedisCache`) e fake de
 * teste (`test/unit/FakeCache.ts`) — não é uma porta de domínio (cache não
 * é um conceito de negócio), por isso mora em `infrastructure/`, não em
 * `domain/repositories` ou `domain/gateways`.
 */
export interface Cache {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown, ttlSeconds: number): Promise<void>;
  /** Remove todas as chaves com esse prefixo (ex.: invalidar todas as variantes de filtro de um indicador). */
  delByPrefix(prefix: string): Promise<void>;
}
