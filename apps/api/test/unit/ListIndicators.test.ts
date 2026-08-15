import { beforeEach, describe, expect, it } from 'vitest';
import { ListIndicators } from '../../src/application/use-cases/ListIndicators.js';
import { Favorite } from '../../src/domain/entities/Favorite.js';
import { Indicator } from '../../src/domain/entities/Indicator.js';
import { InMemoryFavoriteRepository } from './InMemoryFavoriteRepository.js';
import { InMemoryIndicatorRepository } from './InMemoryIndicatorRepository.js';

describe('ListIndicators (caso de uso)', () => {
  let indicatorRepository: InMemoryIndicatorRepository;
  let favoriteRepository: InMemoryFavoriteRepository;
  let useCase: ListIndicators;

  beforeEach(() => {
    indicatorRepository = new InMemoryIndicatorRepository();
    favoriteRepository = new InMemoryFavoriteRepository();
    useCase = new ListIndicators(indicatorRepository, favoriteRepository);
  });

  it('retorna isFavorite=false por padrão', async () => {
    const indicator = Indicator.create({ name: 'IPCA' });
    await indicatorRepository.save(indicator);

    const result = await useCase.execute();

    expect(result).toEqual([expect.objectContaining({ name: 'IPCA', isFavorite: false })]);
  });

  it('retorna isFavorite=true para indicadores favoritados', async () => {
    const selic = Indicator.create({ name: 'SELIC' });
    const ipca = Indicator.create({ name: 'IPCA' });
    await indicatorRepository.save(selic);
    await indicatorRepository.save(ipca);
    await favoriteRepository.add(Favorite.create({ indicatorId: selic.id }));

    const result = await useCase.execute();

    expect(result).toEqual([
      expect.objectContaining({ name: 'IPCA', isFavorite: false }),
      expect.objectContaining({ name: 'SELIC', isFavorite: true }),
    ]);
  });
});
