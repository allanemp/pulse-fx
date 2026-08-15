import type { FavoriteRepository } from '../../domain/repositories/FavoriteRepository.js';

export interface UnmarkIndicatorAsFavoriteInput {
  indicatorId: string;
}

/**
 * Caso de uso: desmarcar um indicador como favorito. Idempotente — chamar
 * para um indicador que não está favoritado (ou nem existe) não é erro,
 * consistente com a semântica de um DELETE.
 */
export class UnmarkIndicatorAsFavorite {
  constructor(private readonly favoriteRepository: FavoriteRepository) {}

  async execute(input: UnmarkIndicatorAsFavoriteInput): Promise<void> {
    await this.favoriteRepository.remove(input.indicatorId);
  }
}
