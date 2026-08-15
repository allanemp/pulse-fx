import { describe, expect, it } from 'vitest';
import { Observation } from '../../src/domain/entities/Observation.js';
import { DomainError } from '../../src/domain/errors/DomainError.js';

describe('Observation (entidade de domínio)', () => {
  it('cria uma observação válida, inclusive com valor negativo', () => {
    const observation = Observation.create({
      indicatorId: 'indicator-1',
      date: new Date('2026-08-14T00:00:00.000Z'),
      value: -1.5,
    });

    expect(observation.value).toBe(-1.5);
    expect(observation.indicatorId).toBe('indicator-1');
  });

  it('rejeita valor não finito', () => {
    expect(() =>
      Observation.create({ indicatorId: 'indicator-1', date: new Date(), value: Number.NaN }),
    ).toThrow(DomainError);
  });

  it('rejeita indicatorId vazio', () => {
    expect(() => Observation.create({ indicatorId: '   ', date: new Date(), value: 1 })).toThrow(
      DomainError,
    );
  });

  it('rejeita data no futuro', () => {
    const tomorrow = new Date();
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    expect(() =>
      Observation.create({ indicatorId: 'indicator-1', date: tomorrow, value: 1 }),
    ).toThrow(DomainError);
  });
});
