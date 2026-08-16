import { z } from 'zod';
import type {
  IndicatorDataPoint,
  IndicatorDataSource,
} from '../../domain/gateways/IndicatorDataSource.js';
import { env } from '../config/env.js';

/** Formato retornado pelo FRED: observações dentro de "observations", `value` como string. */
const fredResponseSchema = z.object({
  observations: z.array(z.object({ date: z.string(), value: z.string() })),
});

function parseIsoDate(value: string): Date {
  const [yearStr, monthStr, dayStr] = value.split('-');

  if (!yearStr || !monthStr || !dayStr) {
    throw new Error(`Data em formato inesperado: "${value}" (esperado YYYY-MM-DD).`);
  }

  return new Date(Date.UTC(Number(yearStr), Number(monthStr) - 1, Number(dayStr)));
}

/**
 * Busca séries do FRED (Federal Reserve Economic Data, banco central dos
 * EUA) — primeira fonte fora do BCB, confirma que o registry aguenta uma
 * API de verdade diferente: exige `api_key` por requisição (o BCB é
 * aberto), e `value` vem como STRING (ex.: `"3.6300000000"`), com `"."`
 * representando dado ausente em vez de omitir o ponto ou usar `null` —
 * confirmado testando o endpoint real antes de implementar.
 *
 * `sourceEndpoint`, para esta fonte, é
 * `"{series_id}:{data_de_início}[:{units}]"` (ex.: `"DFF:2015-01-01"` ou
 * `"CPIAUCSL:2015-01-01:pch"`) — precisa do `series_id` porque, diferente
 * do PTAX (uma série fixa), o FRED tem milhares de séries diferentes atrás
 * do mesmo formato de resposta. `units` é o parâmetro de transformação do
 * próprio FRED (default `"lin"`, valor bruto da série): usado, por
 * exemplo, para pedir o CPI já como variação percentual mês a mês
 * (`"pch"`), comparável ao formato do IPCA, em vez do índice bruto — o
 * FRED faz essa conta no servidor, não precisa ser replicada aqui. O
 * período final é recalculado como "hoje" a cada chamada, como no PTAX —
 * senão a sincronização diária nunca pegaria dados novos.
 */
export class FredIndicatorDataSource implements IndicatorDataSource {
  async fetchSeries(sourceEndpoint: string): Promise<IndicatorDataPoint[]> {
    const [seriesId, startDate, units = 'lin'] = sourceEndpoint.split(':');

    if (!seriesId || !startDate) {
      throw new Error(
        `sourceEndpoint do FRED em formato inesperado: "${sourceEndpoint}" ` +
          '(esperado "SERIES_ID:YYYY-MM-DD[:units]").',
      );
    }

    if (!env.FRED_API_KEY) {
      throw new Error(
        'FRED_API_KEY não configurada — necessária para sincronizar indicadores do FRED.',
      );
    }

    const params = new URLSearchParams({
      series_id: seriesId,
      api_key: env.FRED_API_KEY,
      file_type: 'json',
      observation_start: startDate,
      units,
    });
    const url = `${env.FRED_API_BASE_URL}/series/observations?${params.toString()}`;
    // Mensagens de erro nunca devem vazar a api_key pros logs.
    const safeUrl = url.replace(env.FRED_API_KEY, '***');

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Falha ao buscar série FRED em ${safeUrl}: HTTP ${response.status}`);
    }

    const parsed = fredResponseSchema.safeParse(await response.json());

    if (!parsed.success) {
      throw new Error(
        `Resposta do FRED em formato inesperado em ${safeUrl}: ${parsed.error.message}`,
      );
    }

    return parsed.data.observations
      .filter((observation) => observation.value !== '.')
      .map((observation) => ({
        date: parseIsoDate(observation.date),
        value: Number(observation.value),
      }));
  }
}
