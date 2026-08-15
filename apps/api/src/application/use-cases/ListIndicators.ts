import type { IndicatorDTO } from '@pulse-fx/shared';
import type { IndicatorRepository } from '../../domain/repositories/IndicatorRepository.js';
import { toIndicatorDTO } from '../dtos/IndicatorMapper.js';

/** Caso de uso: listar os indicadores cadastrados no catálogo. */
export class ListIndicators {
  constructor(private readonly indicatorRepository: IndicatorRepository) {}

  async execute(): Promise<IndicatorDTO[]> {
    const indicators = await this.indicatorRepository.findMany();

    return indicators.sort((a, b) => a.name.localeCompare(b.name)).map(toIndicatorDTO);
  }
}
