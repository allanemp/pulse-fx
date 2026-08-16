import type { Cache } from './Cache.js';

/**
 * Decorator de cache-aside para um caso de uso de leitura SEM input (ex.:
 * `ListIndicators.execute()`) — chave fixa, sempre a mesma. Pra casos de
 * uso com input (ex.: `ListObservations`, que varia por indicador), ver
 * `CachedQueryWithInput`.
 *
 * Implementa o mesmo formato de `execute()` do caso de uso que envolve, então
 * pode substituí-lo em qualquer lugar que dependa dele (ex.: o construtor de
 * um controller) — só o `composition-root.ts` precisa saber que existe.
 */
export class CachedQuery<TOutput> {
  constructor(
    private readonly query: { execute(): Promise<TOutput> },
    private readonly cache: Cache,
    private readonly key: string,
    private readonly ttlSeconds: number,
  ) {}

  async execute(): Promise<TOutput> {
    const cached = await this.cache.get<TOutput>(this.key);

    if (cached !== null) {
      return cached;
    }

    const result = await this.query.execute();
    await this.cache.set(this.key, result, this.ttlSeconds);

    return result;
  }
}
