import { DomainError } from '../../domain/errors/DomainError.js';
import type { IndicatorDataSource } from '../../domain/gateways/IndicatorDataSource.js';
import type { IndicatorDataSourceRegistry } from '../../domain/gateways/IndicatorDataSourceRegistry.js';
import { INDICATOR_SOURCES } from '../../domain/gateways/IndicatorSources.js';
import { BcbPtaxIndicatorDataSource } from './BcbPtaxIndicatorDataSource.js';
import { BcbSgsIndicatorDataSource } from './BcbSgsIndicatorDataSource.js';
import { FredIndicatorDataSource } from './FredIndicatorDataSource.js';

/**
 * Registro de todas as implementações de `IndicatorDataSource` conhecidas
 * pela aplicação — um dicionário simples (`source` -> implementação).
 * Adicionar uma nova fonte é registrar mais uma entrada aqui, sem tocar em
 * `SyncIndicatorObservations` nem em quem já usa o registry.
 */
export class MapIndicatorDataSourceRegistry implements IndicatorDataSourceRegistry {
  private readonly sources: Record<string, IndicatorDataSource> = {
    [INDICATOR_SOURCES.BCB_SGS]: new BcbSgsIndicatorDataSource(),
    [INDICATOR_SOURCES.BCB_PTAX]: new BcbPtaxIndicatorDataSource(),
    [INDICATOR_SOURCES.FRED]: new FredIndicatorDataSource(),
  };

  get(source: string): IndicatorDataSource {
    const dataSource = this.sources[source];

    if (!dataSource) {
      throw new DomainError(`Nenhuma fonte de dados registrada para "${source}".`);
    }

    return dataSource;
  }
}
