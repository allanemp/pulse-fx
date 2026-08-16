import type { Observation as ObservationModel, PrismaClient } from '@prisma/client';
import { Observation } from '../../../domain/entities/Observation.js';
import type {
  ObservationFilter,
  ObservationRepository,
} from '../../../domain/repositories/ObservationRepository.js';

/** Implementação do repositório de observações usando Prisma + PostgreSQL. */
export class PrismaObservationRepository implements ObservationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async upsert(observation: Observation): Promise<void> {
    await this.prisma.observation.upsert({
      where: {
        indicatorId_date: { indicatorId: observation.indicatorId, date: observation.date },
      },
      update: { value: observation.value },
      create: {
        id: observation.id,
        indicatorId: observation.indicatorId,
        date: observation.date,
        value: observation.value,
        createdAt: observation.createdAt,
      },
    });
  }

  async findMany(filter?: ObservationFilter): Promise<Observation[]> {
    const rows = await this.prisma.observation.findMany({
      where: {
        ...(filter?.indicatorId ? { indicatorId: filter.indicatorId } : {}),
        ...(filter?.from || filter?.to
          ? {
              date: {
                ...(filter.from ? { gte: filter.from } : {}),
                ...(filter.to ? { lte: filter.to } : {}),
              },
            }
          : {}),
      },
      orderBy: { date: 'desc' },
    });

    return rows.map((row) => this.toDomain(row));
  }

  private toDomain(row: ObservationModel): Observation {
    return Observation.restore({
      id: row.id,
      indicatorId: row.indicatorId,
      date: row.date,
      value: Number(row.value),
      createdAt: row.createdAt,
    });
  }
}
