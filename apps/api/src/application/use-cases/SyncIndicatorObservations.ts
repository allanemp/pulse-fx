import { Observation } from '../../domain/entities/Observation.js';
import { DomainError } from '../../domain/errors/DomainError.js';
import type { IndicatorDataSource } from '../../domain/gateways/IndicatorDataSource.js';
import type { IndicatorRepository } from '../../domain/repositories/IndicatorRepository.js';
import type { ObservationRepository } from '../../domain/repositories/ObservationRepository.js';

export interface SyncIndicatorObservationsInput {
  indicatorId: string;
}

export interface SyncIndicatorObservationsResult {
  indicatorId: string;
  observationsSynced: number;
}

/**
 * Caso de uso: busca a série completa de um indicador na fonte externa e
 * grava (upsert) cada ponto como uma `Observation`.
 *
 * Chamado tanto pelo seed (bootstrap manual, um indicador por vez) quanto
 * pelo worker da fila BullMQ (sincronização diária agendada) — a lógica de
 * "como sincronizar um indicador" mora só aqui.
 */
export class SyncIndicatorObservations {
  constructor(
    private readonly observationRepository: ObservationRepository,
    private readonly indicatorRepository: IndicatorRepository,
    private readonly dataSource: IndicatorDataSource,
  ) {}

  async execute(input: SyncIndicatorObservationsInput): Promise<SyncIndicatorObservationsResult> {
    const indicator = await this.indicatorRepository.findById(input.indicatorId);

    if (!indicator) {
      throw new DomainError(`Indicador "${input.indicatorId}" não encontrado.`);
    }

    if (!indicator.sourceEndpoint) {
      throw new DomainError(
        `Indicador "${indicator.name}" não tem sourceEndpoint configurado — não há como sincronizar.`,
      );
    }

    const dataPoints = await this.dataSource.fetchSeries(indicator.sourceEndpoint);

    for (const point of dataPoints) {
      const observation = Observation.create({
        indicatorId: indicator.id,
        date: point.date,
        value: point.value,
      });

      await this.observationRepository.upsert(observation);
    }

    return { indicatorId: indicator.id, observationsSynced: dataPoints.length };
  }
}
