import type { ObservationDTO } from '@pulse-fx/shared';
import { DomainError } from '../../domain/errors/DomainError.js';
import type { IndicatorRepository } from '../../domain/repositories/IndicatorRepository.js';
import type { ObservationRepository } from '../../domain/repositories/ObservationRepository.js';
import { toObservationDTO } from '../dtos/ObservationMapper.js';

export interface GetLatestObservationInput {
  indicatorId: string;
}

/** Caso de uso: obter a observação mais recente de um indicador. */
export class GetLatestObservation {
  constructor(
    private readonly observationRepository: ObservationRepository,
    private readonly indicatorRepository: IndicatorRepository,
  ) {}

  async execute(input: GetLatestObservationInput): Promise<ObservationDTO> {
    const indicator = await this.indicatorRepository.findById(input.indicatorId);

    if (!indicator) {
      throw new DomainError(`Indicador "${input.indicatorId}" não encontrado.`);
    }

    const observation = await this.observationRepository.findLatestByIndicatorId(input.indicatorId);

    if (!observation) {
      throw new DomainError(`Nenhuma observação encontrada para o indicador "${indicator.name}".`);
    }

    return toObservationDTO(observation);
  }
}
