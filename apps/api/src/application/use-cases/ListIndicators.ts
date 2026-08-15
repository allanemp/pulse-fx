import type { IndicatorDTO } from '@pulse-fx/shared';
import type { FavoriteRepository } from '../../domain/repositories/FavoriteRepository.js';
import type { IndicatorRepository } from '../../domain/repositories/IndicatorRepository.js';
import { toIndicatorDTO } from '../dtos/IndicatorMapper.js';

/** Caso de uso: listar os indicadores cadastrados no catálogo, com `isFavorite` resolvido. */
export class ListIndicators {
  constructor(
    private readonly indicatorRepository: IndicatorRepository,
    private readonly favoriteRepository: FavoriteRepository,
  ) {}

  async execute(): Promise<IndicatorDTO[]> {
    const [indicators, favoriteIndicatorIds] = await Promise.all([
      this.indicatorRepository.findMany(),
      this.favoriteRepository.findFavoriteIndicatorIds(),
    ]);

    const favoriteSet = new Set(favoriteIndicatorIds);

    return indicators
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((indicator) => toIndicatorDTO(indicator, favoriteSet.has(indicator.id)));
  }
}
