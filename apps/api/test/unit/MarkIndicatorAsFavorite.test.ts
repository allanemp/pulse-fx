import { beforeEach, describe, expect, it } from 'vitest';
import { MarkIndicatorAsFavorite } from '../../src/application/use-cases/MarkIndicatorAsFavorite.js';
import { Indicator } from '../../src/domain/entities/Indicator.js';
import { DomainError } from '../../src/domain/errors/DomainError.js';
import { InMemoryFavoriteRepository } from './InMemoryFavoriteRepository.js';
import { InMemoryIndicatorRepository } from './InMemoryIndicatorRepository.js';

describe('MarkIndicatorAsFavorite (caso de uso)', () => {
  let indicatorRepository: InMemoryIndicatorRepository;
  let favoriteRepository: InMemoryFavoriteRepository;
  let useCase: MarkIndicatorAsFavorite;

  beforeEach(() => {
    indicatorRepository = new InMemoryIndicatorRepository();
    favoriteRepository = new InMemoryFavoriteRepository();
    useCase = new MarkIndicatorAsFavorite(favoriteRepository, indicatorRepository);
  });

  it('marca o indicador como favorito', async () => {
    const indicator = Indicator.create({ name: 'SELIC' });
    await indicatorRepository.save(indicator);

    await useCase.execute({ indicatorId: indicator.id });

    expect(await favoriteRepository.findFavoriteIndicatorIds()).toEqual([indicator.id]);
  });

  it('é idempotente: marcar duas vezes não duplica', async () => {
    const indicator = Indicator.create({ name: 'SELIC' });
    await indicatorRepository.save(indicator);

    await useCase.execute({ indicatorId: indicator.id });
    await useCase.execute({ indicatorId: indicator.id });

    expect(favoriteRepository.items).toHaveLength(1);
  });

  it('rejeita quando o indicador não existe', async () => {
    await expect(useCase.execute({ indicatorId: 'indicador-inexistente' })).rejects.toThrow(
      DomainError,
    );

    expect(favoriteRepository.items).toHaveLength(0);
  });
});
