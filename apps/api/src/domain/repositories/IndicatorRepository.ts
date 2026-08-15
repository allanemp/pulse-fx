import type { Indicator } from '../entities/Indicator.js';

/**
 * Porta que o domínio/aplicação depende para persistir e consultar
 * indicadores — a implementação concreta (Prisma) mora em
 * `src/infrastructure/database/repositories/PrismaIndicatorRepository.ts`.
 */
export interface IndicatorRepository {
  save(indicator: Indicator): Promise<void>;
  findById(id: string): Promise<Indicator | null>;
  findByName(name: string): Promise<Indicator | null>;
  findMany(): Promise<Indicator[]>;
}
