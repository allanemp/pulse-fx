import type { Cache } from './Cache.js';

/**
 * Decorator para um caso de uso de escrita (ex.: `RegisterObservation`,
 * `MarkIndicatorAsFavorite`) — executa o comando real e, só se ele
 * terminar sem lançar erro, invalida (`delByPrefix`) o cache que a escrita
 * tornou desatualizado. Se o comando falhar, nada é invalidado (o estado
 * anterior, ainda em cache, continua válido).
 *
 * `invalidationPrefixFn` deriva o prefixo a invalidar a partir do próprio
 * input do comando — ex.: registrar uma observação de um indicador invalida
 * só o cache DAQUELE indicador, não a lista inteira.
 */
export class CacheInvalidatingCommand<TInput, TOutput> {
  constructor(
    private readonly command: { execute(input: TInput): Promise<TOutput> },
    private readonly cache: Cache,
    private readonly invalidationPrefixFn: (input: TInput) => string,
  ) {}

  async execute(input: TInput): Promise<TOutput> {
    const result = await this.command.execute(input);

    await this.cache.delByPrefix(this.invalidationPrefixFn(input));

    return result;
  }
}
