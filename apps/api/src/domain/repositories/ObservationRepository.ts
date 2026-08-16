import type { Observation } from '../entities/Observation.js';

export interface ObservationFilter {
  indicatorId?: string;
  from?: Date;
  to?: Date;
}

/**
 * Porta que o domínio/aplicação depende para persistir e consultar
 * observações — a implementação concreta (Prisma) mora em
 * `src/infrastructure/database/repositories/PrismaObservationRepository.ts`.
 */
export interface ObservationRepository {
  /**
   * Cria ou atualiza por `(indicatorId, date)` sem erro em caso de duplicata
   * — usado pela sincronização automática (seed/worker da fila), que
   * legitimamente reprocessa o mesmo dado (ex.: um mês cujo valor foi
   * revisado pela fonte).
   */
  upsert(observation: Observation): Promise<void>;
  findMany(filter?: ObservationFilter): Promise<Observation[]>;
}
