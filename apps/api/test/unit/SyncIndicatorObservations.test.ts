import { beforeEach, describe, expect, it } from 'vitest';
import { SyncIndicatorObservations } from '../../src/application/use-cases/SyncIndicatorObservations.js';
import { Indicator } from '../../src/domain/entities/Indicator.js';
import { DomainError } from '../../src/domain/errors/DomainError.js';
import { FakeIndicatorDataSource } from './FakeIndicatorDataSource.js';
import { FakeIndicatorDataSourceRegistry } from './FakeIndicatorDataSourceRegistry.js';
import { InMemoryIndicatorRepository } from './InMemoryIndicatorRepository.js';
import { InMemoryObservationRepository } from './InMemoryObservationRepository.js';

const SOURCE_ENDPOINT = '/dados/serie/bcdata.sgs.4390/dados?formato=json';
const FAKE_SOURCE = 'fake-source';

describe('SyncIndicatorObservations (caso de uso)', () => {
  let indicatorRepository: InMemoryIndicatorRepository;
  let observationRepository: InMemoryObservationRepository;

  beforeEach(() => {
    indicatorRepository = new InMemoryIndicatorRepository();
    observationRepository = new InMemoryObservationRepository();
  });

  it('resolve a fonte certa pelo "source" do indicador e grava cada ponto', async () => {
    const indicator = Indicator.create({
      name: 'SELIC',
      source: FAKE_SOURCE,
      sourceEndpoint: SOURCE_ENDPOINT,
    });
    await indicatorRepository.save(indicator);

    const dataSource = new FakeIndicatorDataSource({
      [SOURCE_ENDPOINT]: [
        { date: new Date('2026-07-01T00:00:00.000Z'), value: 1.22 },
        { date: new Date('2026-08-01T00:00:00.000Z'), value: 0.52 },
      ],
    });
    const registry = new FakeIndicatorDataSourceRegistry({ [FAKE_SOURCE]: dataSource });
    const useCase = new SyncIndicatorObservations(
      observationRepository,
      indicatorRepository,
      registry,
    );

    const result = await useCase.execute({ indicatorId: indicator.id });

    expect(result.observationsSynced).toBe(2);
    expect(observationRepository.items).toHaveLength(2);
  });

  it('atualiza (upsert) uma observação já existente em vez de duplicar', async () => {
    const indicator = Indicator.create({
      name: 'SELIC',
      source: FAKE_SOURCE,
      sourceEndpoint: SOURCE_ENDPOINT,
    });
    await indicatorRepository.save(indicator);

    const dataSource = new FakeIndicatorDataSource({
      [SOURCE_ENDPOINT]: [{ date: new Date('2026-08-01T00:00:00.000Z'), value: 0.52 }],
    });
    const registry = new FakeIndicatorDataSourceRegistry({ [FAKE_SOURCE]: dataSource });
    const useCase = new SyncIndicatorObservations(
      observationRepository,
      indicatorRepository,
      registry,
    );

    await useCase.execute({ indicatorId: indicator.id });

    // Fonte revisou o valor do mesmo mês — reprocessar não deve duplicar.
    dataSource.setSeries(SOURCE_ENDPOINT, [
      { date: new Date('2026-08-01T00:00:00.000Z'), value: 0.55 },
    ]);
    await useCase.execute({ indicatorId: indicator.id });

    expect(observationRepository.items).toHaveLength(1);
    expect(observationRepository.items[0]?.value).toBe(0.55);
  });

  it('rejeita quando o "source" do indicador não tem fonte registrada', async () => {
    const indicator = Indicator.create({
      name: 'SELIC',
      source: 'fonte-desconhecida',
      sourceEndpoint: SOURCE_ENDPOINT,
    });
    await indicatorRepository.save(indicator);

    const registry = new FakeIndicatorDataSourceRegistry({});
    const useCase = new SyncIndicatorObservations(
      observationRepository,
      indicatorRepository,
      registry,
    );

    await expect(useCase.execute({ indicatorId: indicator.id })).rejects.toThrow();
  });

  it('rejeita quando o indicador não existe', async () => {
    const registry = new FakeIndicatorDataSourceRegistry({});
    const useCase = new SyncIndicatorObservations(
      observationRepository,
      indicatorRepository,
      registry,
    );

    await expect(useCase.execute({ indicatorId: 'indicador-inexistente' })).rejects.toThrow(
      DomainError,
    );
  });

  it('rejeita quando o indicador não tem source/sourceEndpoint', async () => {
    const indicator = Indicator.create({ name: 'Indicador manual' });
    await indicatorRepository.save(indicator);

    const registry = new FakeIndicatorDataSourceRegistry({});
    const useCase = new SyncIndicatorObservations(
      observationRepository,
      indicatorRepository,
      registry,
    );

    await expect(useCase.execute({ indicatorId: indicator.id })).rejects.toThrow(DomainError);
  });
});
