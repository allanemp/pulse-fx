/**
 * Formato das chaves de cache — centralizado aqui pra quem lê (`CachedQuery`)
 * e quem invalida (`CacheInvalidatingCommand`) nunca ficarem dessincronizados
 * sobre como uma chave é montada.
 */
export const cacheKeys = {
  /** `ListIndicators` não tem input — sempre a mesma chave. */
  indicatorsList: (): string => 'indicators:list',

  /** `ListObservations` varia por indicador e pelo filtro opcional de período. */
  observationsList: (indicatorId: string, from?: Date | undefined, to?: Date | undefined): string =>
    `${cacheKeys.observationsPrefix(indicatorId)}${from?.toISOString() ?? ''}:${to?.toISOString() ?? ''}`,

  /** Prefixo que cobre TODAS as variantes de filtro cacheadas de um indicador — usado só para invalidar. */
  observationsPrefix: (indicatorId: string): string => `observations:${indicatorId}:`,
};
