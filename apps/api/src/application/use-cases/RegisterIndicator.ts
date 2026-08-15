import type { IndicatorDTO } from '@pulse-fx/shared';
import { Indicator } from '../../domain/entities/Indicator.js';
import { DomainError } from '../../domain/errors/DomainError.js';
import type { IndicatorRepository } from '../../domain/repositories/IndicatorRepository.js';
import { toIndicatorDTO } from '../dtos/IndicatorMapper.js';

export interface RegisterIndicatorInput {
  name: string;
  sourceEndpoint?: string | undefined;
}

/**
 * Caso de uso: cadastrar um novo indicador no catálogo.
 *
 * A checagem de nome duplicado acontece aqui (e não só na constraint
 * `@@unique` do banco) para devolver um erro de negócio claro (422) em vez
 * de deixar vazar um erro de infraestrutura para quem chamou a API.
 */
export class RegisterIndicator {
  constructor(private readonly indicatorRepository: IndicatorRepository) {}

  async execute(input: RegisterIndicatorInput): Promise<IndicatorDTO> {
    const existing = await this.indicatorRepository.findByName(input.name.trim());

    if (existing) {
      throw new DomainError(`Já existe um indicador chamado "${existing.name}".`);
    }

    const indicator = Indicator.create(input);

    await this.indicatorRepository.save(indicator);

    return toIndicatorDTO(indicator);
  }
}
