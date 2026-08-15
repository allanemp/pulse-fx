import type { IndicatorDataSource } from './IndicatorDataSource.js';

/**
 * Porta para resolver, em runtime, qual `IndicatorDataSource` sabe
 * interpretar um indicador específico, a partir do `Indicator.source`
 * gravado no banco. Existe porque a escolha da implementação não pode ser
 * fixada de antemão (como acontece com um `*Repository`, sempre a mesma
 * implementação em toda a aplicação) — depende de um dado que só se sabe
 * em tempo de execução, indicador por indicador.
 */
export interface IndicatorDataSourceRegistry {
  /** Lança `DomainError` se `source` não tiver implementação registrada. */
  get(source: string): IndicatorDataSource;
}
