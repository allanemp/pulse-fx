import type { ObservationDTO } from '@pulse-fx/shared';
import { DomainError } from '../../domain/errors/DomainError.js';
import type { IndicatorRepository } from '../../domain/repositories/IndicatorRepository.js';
import type { ObservationRepository } from '../../domain/repositories/ObservationRepository.js';
import { toObservationDTO } from '../dtos/ObservationMapper.js';

export interface ListObservationsInput {
  indicatorId: string;
  from?: Date | undefined;
  to?: Date | undefined;
}

/** Caso de uso: listar a série temporal de observações de um indicador. */
export class ListObservations {
  constructor(
    private readonly observationRepository: ObservationRepository,
    private readonly indicatorRepository: IndicatorRepository,
  ) {}

  async execute(input: ListObservationsInput): Promise<ObservationDTO[]> {
    const indicator = await this.indicatorRepository.findById(input.indicatorId);

    if (!indicator) {
      throw new DomainError(`Indicador "${input.indicatorId}" não encontrado.`);
    }

    const observations = await this.observationRepository.findMany({
      indicatorId: input.indicatorId,
      ...(input.from ? { from: input.from } : {}),
      ...(input.to ? { to: input.to } : {}),
    });

    return observations.sort((a, b) => a.date.getTime() - b.date.getTime()).map(toObservationDTO);
  }
}
