import { beforeEach, describe, expect, it } from 'vitest';
import { GetLatestObservation } from '../../src/application/use-cases/GetLatestObservation.js';
import { Indicator } from '../../src/domain/entities/Indicator.js';
import { Observation } from '../../src/domain/entities/Observation.js';
import { DomainError } from '../../src/domain/errors/DomainError.js';
import { InMemoryIndicatorRepository } from './InMemoryIndicatorRepository.js';
import { InMemoryObservationRepository } from './InMemoryObservationRepository.js';

describe('GetLatestObservation (caso de uso)', () => {
  let indicatorRepository: InMemoryIndicatorRepository;
  let observationRepository: InMemoryObservationRepository;
  let useCase: GetLatestObservation;

  beforeEach(() => {
    indicatorRepository = new InMemoryIndicatorRepository();
    observationRepository = new InMemoryObservationRepository();
    useCase = new GetLatestObservation(observationRepository, indicatorRepository);
  });

  it('retorna a observação com a data mais recente', async () => {
    const indicator = Indicator.create({ name: 'SELIC' });
    await indicatorRepository.save(indicator);

    await observationRepository.save(
      Observation.create({
        indicatorId: indicator.id,
        date: new Date('2026-06-01T00:00:00.000Z'),
        value: 1.12,
      }),
    );
    await observationRepository.save(
      Observation.create({
        indicatorId: indicator.id,
        date: new Date('2026-08-01T00:00:00.000Z'),
        value: 0.52,
      }),
    );
    await observationRepository.save(
      Observation.create({
        indicatorId: indicator.id,
        date: new Date('2026-07-01T00:00:00.000Z'),
        value: 1.22,
      }),
    );

    const result = await useCase.execute({ indicatorId: indicator.id });

    expect(result).toMatchObject({ value: 0.52 });
    expect(result.date).toBe('2026-08-01');
  });

  it('rejeita quando o indicador não existe', async () => {
    await expect(useCase.execute({ indicatorId: 'indicador-inexistente' })).rejects.toThrow(
      DomainError,
    );
  });

  it('rejeita quando o indicador existe mas não tem observações', async () => {
    const indicator = Indicator.create({ name: 'IPCA' });
    await indicatorRepository.save(indicator);

    await expect(useCase.execute({ indicatorId: indicator.id })).rejects.toThrow(DomainError);
  });
});
