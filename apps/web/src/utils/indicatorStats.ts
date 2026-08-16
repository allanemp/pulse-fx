import type { ObservationDTO } from '@pulse-fx/shared';

export type HistoryPeriod = '30d' | '12m' | '5y';

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const PERIOD_DAYS: Record<HistoryPeriod, number> = { '30d': 30, '12m': 365, '5y': 365 * 5 };
const MIN_POINTS_FALLBACK = 2;

/**
 * Filtra o histórico (já vem ordenado por data crescente da API) pela
 * janela de período escolhida. Se a janela ficar com menos de 2 pontos
 * (ex.: indicador mensal com sync atrasado), cai para os últimos pontos
 * disponíveis — o gráfico nunca fica vazio.
 */
export function filterByPeriod(
  observations: ObservationDTO[],
  period: HistoryPeriod,
): ObservationDTO[] {
  const threshold = Date.now() - PERIOD_DAYS[period] * DAY_IN_MS;
  const withinWindow = observations.filter(
    (observation) => new Date(observation.date).getTime() >= threshold,
  );

  if (withinWindow.length >= MIN_POINTS_FALLBACK) {
    return withinWindow;
  }

  return observations.slice(-MIN_POINTS_FALLBACK);
}

export interface PeriodOption {
  value: HistoryPeriod;
  label: string;
}

/**
 * Espera "daily" ou "monthly" — os mesmos valores gravados em
 * `Indicator.frequency` no backend (ver
 * `apps/api/src/domain/entities/IndicatorFrequency.ts`). Não reaproveita um
 * tipo importado de lá: o domínio do backend não é exposto ao frontend,
 * só o formato de fio (`IndicatorDTO.frequency: string`).
 *
 * "30 dias" não faz sentido pra uma série mensal (mostraria 0 ou 1 ponto) —
 * por isso as janelas de período são diferentes por frequência, não um
 * toggle genérico igual pra tudo.
 */
export function periodOptionsForFrequency(frequency: string): PeriodOption[] {
  if (frequency === 'monthly') {
    return [
      { value: '12m', label: '12 meses' },
      { value: '5y', label: '5 anos' },
    ];
  }

  return [
    { value: '30d', label: '30 dias' },
    { value: '12m', label: '12 meses' },
  ];
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
