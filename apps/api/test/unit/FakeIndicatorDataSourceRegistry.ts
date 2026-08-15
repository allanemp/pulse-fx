import type { IndicatorDataSource } from '../../src/domain/gateways/IndicatorDataSource.js';
import type { IndicatorDataSourceRegistry } from '../../src/domain/gateways/IndicatorDataSourceRegistry.js';

/** Fake do registry, usado apenas em testes — sem rede. */
export class FakeIndicatorDataSourceRegistry implements IndicatorDataSourceRegistry {
  constructor(private readonly sources: Record<string, IndicatorDataSource>) {}

  get(source: string): IndicatorDataSource {
    const dataSource = this.sources[source];

    if (!dataSource) {
      throw new Error(`Nenhuma fonte de dados registrada para "${source}" (fake de teste).`);
    }

    return dataSource;
  }
}
