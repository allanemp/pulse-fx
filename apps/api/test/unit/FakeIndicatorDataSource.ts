import type {
  IndicatorDataPoint,
  IndicatorDataSource,
} from '../../src/domain/gateways/IndicatorDataSource.js';

/** Fake do gateway de fonte externa, usado apenas em testes — sem rede. */
export class FakeIndicatorDataSource implements IndicatorDataSource {
  constructor(private seriesByEndpoint: Record<string, IndicatorDataPoint[]>) {}

  setSeries(sourceEndpoint: string, series: IndicatorDataPoint[]): void {
    this.seriesByEndpoint = { ...this.seriesByEndpoint, [sourceEndpoint]: series };
  }

  async fetchSeries(sourceEndpoint: string): Promise<IndicatorDataPoint[]> {
    return this.seriesByEndpoint[sourceEndpoint] ?? [];
  }
}
