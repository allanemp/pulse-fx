import type { ObservationDTO } from '@pulse-fx/shared';

export type HistoryPeriod = '30d' | '12m';

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const MIN_POINTS_FALLBACK = 2;

/**
 * Filtra o histórico (já vem ordenado por data crescente da API) pelos
 * últimos 30 dias ou 12 meses corridos. Indicadores mensais (Selic, IPCA)
 * às vezes só têm 1 ponto dentro de uma janela de 30 dias — nesse caso cai
 * para os últimos pontos disponíveis, para o gráfico nunca ficar vazio.
 */
export function filterByPeriod(
  observations: ObservationDTO[],
  period: HistoryPeriod,
): ObservationDTO[] {
  const days = period === '30d' ? 30 : 365;
  const threshold = Date.now() - days * DAY_IN_MS;
  const withinWindow = observations.filter(
    (observation) => new Date(observation.date).getTime() >= threshold,
  );

  if (withinWindow.length >= MIN_POINTS_FALLBACK) {
    return withinWindow;
  }

  return observations.slice(-MIN_POINTS_FALLBACK);
}

export interface MinMaxResult {
  min: ObservationDTO;
  max: ObservationDTO;
}

/** Menor e maior valor de um conjunto de observações (ex.: o período exibido no gráfico). */
export function computeMinMax(observations: ObservationDTO[]): MinMaxResult | null {
  const [first, ...rest] = observations;

  if (!first) {
    return null;
  }

  return rest.reduce<MinMaxResult>(
    (acc, observation) => ({
      min: observation.value < acc.min.value ? observation : acc.min,
      max: observation.value > acc.max.value ? observation : acc.max,
    }),
    { min: first, max: first },
  );
}
