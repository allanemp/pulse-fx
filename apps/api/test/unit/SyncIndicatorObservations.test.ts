import { beforeEach, describe, expect, it } from 'vitest';
import { SyncIndicatorObservations } from '../../src/application/use-cases/SyncIndicatorObservations.js';
import { Indicator } from '../../src/domain/entities/Indicator.js';
import { DomainError } from '../../src/domain/errors/DomainError.js';
import { FakeIndicatorDataSource } from './FakeIndicatorDataSource.js';
import { InMemoryIndicatorRepository } from './InMemoryIndicatorRepository.js';
import { InMemoryObservationRepository } from './InMemoryObservationRepository.js';

describe('SyncIndicatorObservations (caso de uso)', () => {
  let indicatorRepository: InMemoryIndicatorRepository;
  let observationRepository: InMemoryObservationRepository;

  beforeEach(() => {
    indicatorRepository = new InMemoryIndicatorRepository();
    observationRepository = new InMemoryObservationRepository();
  });

  it('busca a série na fonte externa e grava cada ponto', async () => {
    const indicator = Indicator.create({
      name: 'SELIC',
      sourceEndpoint: '/dados/serie/bcdata.sgs.4390/dados?formato=json',
    });
    await indicatorRepository.save(indicator);

    const dataSource = new FakeIndicatorDataSource({
      '/dados/serie/bcdata.sgs.4390/dados?formato=json': [
        { date: new Date('2026-07-01T00:00:00.000Z'), value: 1.22 },
        { date: new Date('2026-08-01T00:00:00.000Z'), value: 0.52 },
      ],
    });
    const useCase = new SyncIndicatorObservations(
      observationRepository,
      indicatorRepository,
      dataSource,
    );

    const result = await useCase.execute({ indicatorId: indicator.id });

    expect(result.observationsSynced).toBe(2);
    expect(observationRepository.items).toHaveLength(2);
  });

  it('atualiza (upsert) uma observação já existente em vez de duplicar', async () => {
    const indicator = Indicator.create({
      name: 'SELIC',
      sourceEndpoint: '/dados/serie/bcdata.sgs.4390/dados?formato=json',
    });
    await indicatorRepository.save(indicator);

    const dataSource = new FakeIndicatorDataSource({
      '/dados/serie/bcdata.sgs.4390/dados?formato=json': [
        { date: new Date('2026-08-01T00:00:00.000Z'), value: 0.52 },
      ],
    });
    const useCase = new SyncIndicatorObservations(
      observationRepository,
      indicatorRepository,
      dataSource,
    );

    await useCase.execute({ indicatorId: indicator.id });

    // Fonte revisou o valor do mesmo mês — reprocessar não deve duplicar.
    dataSource.setSeries('/dados/serie/bcdata.sgs.4390/dados?formato=json', [
      { date: new Date('2026-08-01T00:00:00.000Z'), value: 0.55 },
    ]);
    await useCase.execute({ indicatorId: indicator.id });

    expect(observationRepository.items).toHaveLength(1);
    expect(observationRepository.items[0]?.value).toBe(0.55);
  });

  it('rejeita quando o indicador não existe', async () => {
    const dataSource = new FakeIndicatorDataSource({});
    const useCase = new SyncIndicatorObservations(
      observationRepository,
      indicatorRepository,
      dataSource,
    );

    await expect(useCase.execute({ indicatorId: 'indicador-inexistente' })).rejects.toThrow(
      DomainError,
    );
  });

  it('rejeita quando o indicador não tem sourceEndpoint', async () => {
    const indicator = Indicator.create({ name: 'Indicador manual' });
    await indicatorRepository.save(indicator);

    const dataSource = new FakeIndicatorDataSource({});
    const useCase = new SyncIndicatorObservations(
      observationRepository,
      indicatorRepository,
      dataSource,
    );

    await expect(useCase.execute({ indicatorId: indicator.id })).rejects.toThrow(DomainError);
  });
});
