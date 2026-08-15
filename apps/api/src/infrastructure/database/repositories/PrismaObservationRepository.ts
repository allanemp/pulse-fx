import { Prisma } from '@prisma/client';
import type { Observation as ObservationModel, PrismaClient } from '@prisma/client';
import { Observation } from '../../../domain/entities/Observation.js';
import { DomainError } from '../../../domain/errors/DomainError.js';
import type {
  ObservationFilter,
  ObservationRepository,
} from '../../../domain/repositories/ObservationRepository.js';

const UNIQUE_CONSTRAINT_VIOLATION = 'P2002';

/**
 * Implementação do repositório de observações usando Prisma + PostgreSQL.
 *
 * Traduz a violação da constraint `@@unique([indicatorId, date])` (erro de
 * infraestrutura) em `DomainError` — a única checagem de duplicidade que só
 * pode ser garantida de forma segura pelo banco (condição de corrida entre
 * requisições concorrentes), então a infraestrutura é quem sabe reconhecê-la
 * e traduzi-la para uma linguagem que a camada de apresentação entende.
 */
export class PrismaObservationRepository implements ObservationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(observation: Observation): Promise<void> {
    try {
      await this.prisma.observation.create({
        data: {
          id: observation.id,
          indicatorId: observation.indicatorId,
          date: observation.date,
          value: observation.value,
          createdAt: observation.createdAt,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === UNIQUE_CONSTRAINT_VIOLATION
      ) {
        throw new DomainError('Já existe uma observação deste indicador nesta data.');
      }

      throw error;
    }
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
