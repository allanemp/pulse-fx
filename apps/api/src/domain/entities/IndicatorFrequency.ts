/**
 * Com que frequência a própria fonte publica uma observação nova — uma
 * propriedade intrínseca da série, não uma escolha de exibição. Usada tanto
 * para justificar a regra de variação % (ver `computeLatestChange` no
 * frontend: comparar com "a linha anterior" já significa "o mês anterior"
 * numa série mensal e "o dia útil anterior" numa diária, porque é assim que
 * cada fonte grava os dados) quanto para escolher as janelas de histórico
 * do gráfico (ver `IndicatorDetailModal`).
 */
export const INDICATOR_FREQUENCIES = {
  /** Uma observação por dia útil (ex.: câmbio, taxas de juros de mercado). */
  DAILY: 'daily',
  /** Uma observação por mês (ex.: índices de inflação, taxas publicadas mensalmente). */
  MONTHLY: 'monthly',
} as const;

export type IndicatorFrequency = (typeof INDICATOR_FREQUENCIES)[keyof typeof INDICATOR_FREQUENCIES];
