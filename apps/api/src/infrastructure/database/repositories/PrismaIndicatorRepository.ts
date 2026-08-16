import type { Indicator as IndicatorModel, PrismaClient } from '@prisma/client';
import { Indicator } from '../../../domain/entities/Indicator.js';
import type { IndicatorFrequency } from '../../../domain/entities/IndicatorFrequency.js';
import type { IndicatorRepository } from '../../../domain/repositories/IndicatorRepository.js';

export class PrismaIndicatorRepository implements IndicatorRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Indicator | null> {
    const row = await this.prisma.indicator.findUnique({ where: { id } });

    return row ? this.toDomain(row) : null;
  }

  async findMany(): Promise<Indicator[]> {
    const rows = await this.prisma.indicator.findMany();

    return rows.map((row) => this.toDomain(row));
  }

  async findSyncable(): Promise<Indicator[]> {
    const rows = await this.prisma.indicator.findMany({
      where: { source: { not: null }, sourceEndpoint: { not: null } },
    });

    return rows.map((row) => this.toDomain(row));
  }

  private toDomain(row: IndicatorModel): Indicator {
    return Indicator.restore({
      id: row.id,
      name: row.name,
      unit: row.unit ?? undefined,
      description: row.description ?? undefined,
      source: row.source ?? undefined,
      sourceEndpoint: row.sourceEndpoint ?? undefined,
      // Prisma não conhece a union literal do domínio — a coluna é NOT NULL
      // e só o seed grava nela, sempre com um valor de INDICATOR_FREQUENCIES.
      frequency: row.frequency as IndicatorFrequency,
      createdAt: row.createdAt,
    });
  }
}
