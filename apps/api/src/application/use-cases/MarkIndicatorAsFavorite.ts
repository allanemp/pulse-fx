import { Favorite } from '../../domain/entities/Favorite.js';
import { DomainError } from '../../domain/errors/DomainError.js';
import type { FavoriteRepository } from '../../domain/repositories/FavoriteRepository.js';
import type { IndicatorRepository } from '../../domain/repositories/IndicatorRepository.js';

export interface MarkIndicatorAsFavoriteInput {
  indicatorId: string;
}

/** Caso de uso: marcar um indicador como favorito. Idempotente. */
export class MarkIndicatorAsFavorite {
  constructor(
    private readonly favoriteRepository: FavoriteRepository,
    private readonly indicatorRepository: IndicatorRepository,
  ) {}

  async execute(input: MarkIndicatorAsFavoriteInput): Promise<void> {
    const indicator = await this.indicatorRepository.findById(input.indicatorId);

    if (!indicator) {
      throw new DomainError(`Indicador "${input.indicatorId}" não encontrado.`);
    }

    const favorite = Favorite.create({ indicatorId: input.indicatorId });

    await this.favoriteRepository.add(favorite);
  }
}
