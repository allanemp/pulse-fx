import { z } from 'zod';
import type {
  IndicatorDataPoint,
  IndicatorDataSource,
} from '../../domain/gateways/IndicatorDataSource.js';
import { env } from '../config/env.js';

/** Formato retornado pelo PTAX/Olinda: objeto OData, cotações dentro de "value". */
const ptaxResponseSchema = z.object({
  value: z.array(
    z.object({
      cotacaoCompra: z.number(),
      cotacaoVenda: z.number(),
      dataHoraCotacao: z.string(),
    }),
  ),
});

function parseIsoDate(value: string): Date {
  const [yearStr, monthStr, dayStr] = value.slice(0, 10).split('-');

  if (!yearStr || !monthStr || !dayStr) {
    throw new Error(`Data em formato inesperado: "${value}" (esperado YYYY-MM-DD...).`);
  }

  return new Date(Date.UTC(Number(yearStr), Number(monthStr) - 1, Number(dayStr)));
}

function formatOdataDate(date: Date): string {
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  return `${mm}-${dd}-${date.getUTCFullYear()}`;
}

/**
 * Busca a cotação do dólar comercial (PTAX) no Olinda/BCB — API diferente
 * do SGS: outro domínio, configurado em `BCB_PTAX_API_BASE_URL` (não
 * `BCB_API_BASE_URL` — são serviços do BCB em domínios diferentes),
 * outro formato de resposta (OData, cotações aninhadas em `"value"`, com
 * `cotacaoCompra`/`cotacaoVenda` em vez de `valor`, e data com hora
 * embutida em vez de `DD/MM/YYYY`). Confirmado testando o endpoint real
 * antes de implementar — por isso é um `IndicatorDataSource` separado do
 * `BcbSgsIndicatorDataSource`, não uma variação dele.
 *
 * Guarda só a cotação de **venda** (`cotacaoVenda`) como `value` — é a
 * referência mais comum pra BRL/USD; a de compra fica de fora (a entidade
 * `Observation` tem um único `value` por data).
 *
 * `sourceEndpoint`, para esta fonte, não é um caminho de URL — é a data de
 * início da série (`YYYY-MM-DD`). O período final é recalculado como "hoje"
 * a cada chamada: se fosse uma data fixa, a sincronização diária nunca
 * pegaria dados novos.
 */
export class BcbPtaxIndicatorDataSource implements IndicatorDataSource {
  async fetchSeries(sourceEndpoint: string): Promise<IndicatorDataPoint[]> {
    const startDate = parseIsoDate(sourceEndpoint);
    const endDate = new Date();

    const url =
      `${env.BCB_PTAX_API_BASE_URL}/CotacaoDolarPeriodo(dataInicial=@dataInicial,dataFinalCotacao=@dataFinalCotacao)` +
      `?@dataInicial='${formatOdataDate(startDate)}'&@dataFinalCotacao='${formatOdataDate(endDate)}'&$format=json`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Falha ao buscar série PTAX em ${url}: HTTP ${response.status}`);
    }

    const parsed = ptaxResponseSchema.safeParse(await response.json());

    if (!parsed.success) {
      throw new Error(`Resposta do PTAX em formato inesperado em ${url}: ${parsed.error.message}`);
    }

    return parsed.data.value.map((quote) => ({
      date: parseIsoDate(quote.dataHoraCotacao),
      value: quote.cotacaoVenda,
    }));
  }
}
