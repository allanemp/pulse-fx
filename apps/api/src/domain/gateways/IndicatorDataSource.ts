export interface IndicatorDataPoint {
  date: Date;
  value: number;
}

/**
 * Porta para buscar a série de um indicador numa fonte externa. Diferente
 * de um `*Repository` (persistência local), um gateway fala com um sistema
 * fora do nosso controle — por isso mora numa pasta separada, mesmo
 * seguindo o mesmo princípio de inversão de dependência.
 *
 * Existe **uma implementação por formato de resposta**, não por indicador:
 * `BcbSgsIndicatorDataSource` entende o SGS do Banco Central (Selic, IPCA,
 * CDI, ... — todos no mesmo formato genérico `{data, valor}`), enquanto
 * `BcbPtaxIndicatorDataSource` entende o PTAX (câmbio) — outra API do BCB,
 * em outro domínio, com formato OData completamente diferente. Qual
 * implementação usar para um indicador é decidido por `Indicator.source`,
 * resolvido em runtime via `IndicatorDataSourceRegistry`.
 *
 * O significado de `sourceEndpoint` é decidido por cada implementação: para
 * o SGS é um complemento de URL; para o PTAX é uma data de início (o dado
 * muda de forma dependendo de como a fonte espera ser consultada).
 */
export interface IndicatorDataSource {
  fetchSeries(sourceEndpoint: string): Promise<IndicatorDataPoint[]>;
}
