import type { IndicatorDTO } from '@pulse-fx/shared';
import type { Indicator } from '../../domain/entities/Indicator.js';

export function toIndicatorDTO(entity: Indicator): IndicatorDTO {
  return {
    id: entity.id,
    name: entity.name,
    ...(entity.sourceEndpoint ? { sourceEndpoint: entity.sourceEndpoint } : {}),
    createdAt: entity.createdAt.toISOString(),
  };
}
