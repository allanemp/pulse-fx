/**
 * Identificadores de `source` reconhecidos pelo `IndicatorDataSourceRegistry`
 * — usados tanto para registrar as implementações concretas (infraestrutura)
 * quanto para cadastrar indicadores (seed) com o valor certo.
 */
export const INDICATOR_SOURCES = {
  /** SGS (Sistema Gerenciador de Séries Temporais) do Banco Central — Selic, IPCA, CDI, etc. */
  BCB_SGS: 'bcb-sgs',
  /** PTAX (câmbio) do Banco Central — API e formato diferentes do SGS. */
  BCB_PTAX: 'bcb-ptax',
} as const;

export type IndicatorSource = (typeof INDICATOR_SOURCES)[keyof typeof INDICATOR_SOURCES];
