import type { ObservationDTO } from '@pulse-fx/shared';

export interface IndicatorChange {
  latest: ObservationDTO;
  previous: ObservationDTO | null;
  /** Variação percentual do valor mais recente vs. o anterior. `null` sem base de comparação. */
  changePercent: number | null;
}

/**
 * Deriva "valor mais recente / anterior / variação %" a partir do histórico
 * completo de um indicador (já vem ordenado por data crescente da API).
 */
export function computeLatestChange(observations: ObservationDTO[]): IndicatorChange | null {
  if (observations.length === 0) {
    return null;
  }

  const latest = observations[observations.length - 1];
  const previous = observations.length >= 2 ? observations[observations.length - 2] : undefined;

  if (!latest) {
    return null;
  }

  const changePercent =
    previous && previous.value !== 0
      ? ((latest.value - previous.value) / Math.abs(previous.value)) * 100
      : null;

  return { latest, previous: previous ?? null, changePercent };
}
