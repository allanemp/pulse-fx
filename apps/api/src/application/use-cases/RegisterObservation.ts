import type { ObservationDTO } from '@pulse-fx/shared';
import { Observation } from '../../domain/entities/Observation.js';
import { DomainError } from '../../domain/errors/DomainError.js';
import type { IndicatorRepository } from '../../domain/repositories/IndicatorRepository.js';
import type { ObservationRepository } from '../../domain/repositories/ObservationRepository.js';
import { toObservationDTO } from '../dtos/ObservationMapper.js';

export interface RegisterObservationInput {
  indicatorId: string;
  date: Date;
  value: number;
}

/**
 * Caso de uso: registrar uma observação (valor em uma data) para um
 * indicador existente.
 *
 * Depende de `IndicatorRepository` só para validar que o indicador existe
 * antes de criar a observação — devolve um erro de negócio claro em vez de
 * deixar a violação de FK do banco vazar como erro genérico.
 */
export class RegisterObservation {
  constructor(
    private readonly observationRepository: ObservationRepository,
    private readonly indicatorRepository: IndicatorRepository,
  ) {}

  async execute(input: RegisterObservationInput): Promise<ObservationDTO> {
    const indicator = await this.indicatorRepository.findById(input.indicatorId);

    if (!indicator) {
      throw new DomainError(`Indicador "${input.indicatorId}" não encontrado.`);
    }

    const observation = Observation.create(input);

    await this.observationRepository.save(observation);

    return toObservationDTO(observation);
  }
}
