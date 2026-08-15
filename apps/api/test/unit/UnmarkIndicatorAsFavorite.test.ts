import { beforeEach, describe, expect, it } from 'vitest';
import { UnmarkIndicatorAsFavorite } from '../../src/application/use-cases/UnmarkIndicatorAsFavorite.js';
import { Favorite } from '../../src/domain/entities/Favorite.js';
import { InMemoryFavoriteRepository } from './InMemoryFavoriteRepository.js';

describe('UnmarkIndicatorAsFavorite (caso de uso)', () => {
  let favoriteRepository: InMemoryFavoriteRepository;
  let useCase: UnmarkIndicatorAsFavorite;

  beforeEach(() => {
    favoriteRepository = new InMemoryFavoriteRepository();
    useCase = new UnmarkIndicatorAsFavorite(favoriteRepository);
  });

  it('remove o favorito existente', async () => {
    await favoriteRepository.add(Favorite.create({ indicatorId: 'indicator-1' }));

    await useCase.execute({ indicatorId: 'indicator-1' });

    expect(favoriteRepository.items).toHaveLength(0);
  });

  it('é idempotente: desmarcar um indicador que não está favoritado não lança erro', async () => {
    await expect(
      useCase.execute({ indicatorId: 'indicador-nunca-favoritado' }),
    ).resolves.not.toThrow();
  });
});
