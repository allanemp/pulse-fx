import type { ObservationDTO } from '@pulse-fx/shared';
import type { Observation } from '../../domain/entities/Observation.js';

export function toObservationDTO(entity: Observation): ObservationDTO {
  return {
    id: entity.id,
    indicatorId: entity.indicatorId,
    date: entity.date.toISOString().slice(0, 10),
    value: entity.value,
    createdAt: entity.createdAt.toISOString(),
  };
}
