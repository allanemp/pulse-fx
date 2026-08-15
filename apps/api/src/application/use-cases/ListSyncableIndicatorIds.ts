import type { IndicatorRepository } from '../../domain/repositories/IndicatorRepository.js';

/**
 * Caso de uso: IDs dos indicadores que a sincronização automática sabe
 * atualizar (têm `sourceEndpoint`) — usado pelo job diário da fila para
 * decidir quais indicadores enfileirar.
 */
export class ListSyncableIndicatorIds {
  constructor(private readonly indicatorRepository: IndicatorRepository) {}

  async execute(): Promise<string[]> {
    const indicators = await this.indicatorRepository.findSyncable();

    return indicators.map((indicator) => indicator.id);
  }
}
