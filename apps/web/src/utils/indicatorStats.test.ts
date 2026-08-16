import type { ObservationDTO } from '@pulse-fx/shared';
import { describe, expect, it } from 'vitest';
import { filterByPeriod, periodOptionsForFrequency } from './indicatorStats';

describe('periodOptionsForFrequency', () => {
  it('indicador diário oferece 30 dias e 12 meses', () => {
    expect(periodOptionsForFrequency('daily')).toEqual([
      { value: '30d', label: '30 dias' },
      { value: '12m', label: '12 meses' },
    ]);
  });

  it('indicador mensal oferece 12 meses e 5 anos, sem "30 dias" (que mostraria 0 ou 1 ponto)', () => {
    const options = periodOptionsForFrequency('monthly');

    expect(options).toEqual([
      { value: '12m', label: '12 meses' },
      { value: '5y', label: '5 anos' },
    ]);
    expect(options.some((option) => option.value === '30d')).toBe(false);
  });
});

describe('filterByPeriod', () => {
  function observationAt(daysAgo: number, value: number): ObservationDTO {
    const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    return {
      id: `obs-${daysAgo}`,
      indicatorId: 'indicator-1',
      date: date.toISOString().slice(0, 10),
      value,
      createdAt: date.toISOString(),
    };
  }

  it('mantém só observações dentro da janela de 30 dias', () => {
    const observations = [
      observationAt(400, 1),
      observationAt(60, 2),
      observationAt(20, 3),
      observationAt(5, 4),
    ];

    const result = filterByPeriod(observations, '30d');

    expect(result.map((o) => o.value)).toEqual([3, 4]);
  });

  it('cai para os últimos 2 pontos disponíveis quando a janela fica vazia (mensal com poucos dados)', () => {
    const observations = [observationAt(400, 1), observationAt(200, 2)];

    const result = filterByPeriod(observations, '30d');

    expect(result.map((o) => o.value)).toEqual([1, 2]);
  });
});
