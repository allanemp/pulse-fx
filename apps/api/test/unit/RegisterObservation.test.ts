import { beforeEach, describe, expect, it } from 'vitest';
import { RegisterObservation } from '../../src/application/use-cases/RegisterObservation.js';
import { Indicator } from '../../src/domain/entities/Indicator.js';
import { DomainError } from '../../src/domain/errors/DomainError.js';
import { InMemoryIndicatorRepository } from './InMemoryIndicatorRepository.js';
import { InMemoryObservationRepository } from './InMemoryObservationRepository.js';

describe('RegisterObservation (caso de uso)', () => {
  let indicatorRepository: InMemoryIndicatorRepository;
  let observationRepository: InMemoryObservationRepository;
  let useCase: RegisterObservation;

  beforeEach(() => {
    indicatorRepository = new InMemoryIndicatorRepository();
    observationRepository = new InMemoryObservationRepository();
    useCase = new RegisterObservation(observationRepository, indicatorRepository);
  });

  it('persiste a observação quando o indicador existe', async () => {
    const indicator = Indicator.create({ name: 'SELIC' });
    await indicatorRepository.save(indicator);

    const result = await useCase.execute({
      indicatorId: indicator.id,
      date: new Date('2026-08-14T00:00:00.000Z'),
      value: 10.75,
    });

    expect(observationRepository.items).toHaveLength(1);
    expect(result).toMatchObject({ indicatorId: indicator.id, value: 10.75 });
  });

  it('rejeita quando o indicador não existe', async () => {
    await expect(
      useCase.execute({ indicatorId: 'indicador-inexistente', date: new Date(), value: 1 }),
    ).rejects.toThrow(DomainError);

    expect(observationRepository.items).toHaveLength(0);
  });
});
