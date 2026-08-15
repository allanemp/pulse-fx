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
  save(observation: Observation): Promise<void>;
  findMany(filter?: ObservationFilter): Promise<Observation[]>;
}
