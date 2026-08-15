export interface IndicatorDataPoint {
  date: Date;
  value: number;
}

/**
 * Porta para buscar a série de um indicador numa fonte externa (ex.: SGS do
 * Banco Central). Diferente de um `*Repository` (persistência local), um
 * gateway fala com um sistema fora do nosso controle — por isso mora numa
 * pasta separada, mesmo seguindo o mesmo princípio de inversão de
 * dependência (a implementação concreta, `BcbIndicatorDataSource`, mora em
 * `src/infrastructure/gateways`).
 */
export interface IndicatorDataSource {
  fetchSeries(sourceEndpoint: string): Promise<IndicatorDataPoint[]>;
}
