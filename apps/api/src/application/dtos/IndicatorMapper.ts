import type { IndicatorDTO } from '@pulse-fx/shared';
import type { Indicator } from '../../domain/entities/Indicator.js';

/**
 * `isFavorite` não vem da entidade `Indicator` (ver comentário na entidade)
 * — quem chama precisa resolvê-lo (ex.: consultando `FavoriteRepository`) e
 * passar aqui explicitamente.
 */
export function toIndicatorDTO(entity: Indicator, isFavorite: boolean): IndicatorDTO {
  return {
    id: entity.id,
    name: entity.name,
    ...(entity.unit ? { unit: entity.unit } : {}),
    ...(entity.description ? { description: entity.description } : {}),
    ...(entity.source ? { source: entity.source } : {}),
    ...(entity.sourceEndpoint ? { sourceEndpoint: entity.sourceEndpoint } : {}),
    isFavorite,
    createdAt: entity.createdAt.toISOString(),
  };
}
