import type { Cache } from './Cache.js';

/**
 * Mesma ideia de `CachedQuery`, para um caso de uso de leitura que recebe
 * um input (ex.: `ListObservations`, cuja resposta varia por
 * `indicatorId`/`from`/`to`) — a chave de cache é derivada do input via
 * `keyFn`, então inputs diferentes não colidem no mesmo slot de cache.
 */
export class CachedQueryWithInput<TInput, TOutput> {
  constructor(
    private readonly query: { execute(input: TInput): Promise<TOutput> },
    private readonly cache: Cache,
    private readonly keyFn: (input: TInput) => string,
    private readonly ttlSeconds: number,
  ) {}

  async execute(input: TInput): Promise<TOutput> {
    const key = this.keyFn(input);
    const cached = await this.cache.get<TOutput>(key);

    if (cached !== null) {
      return cached;
    }

    const result = await this.query.execute(input);
    await this.cache.set(key, result, this.ttlSeconds);

    return result;
  }
}
