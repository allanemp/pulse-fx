import type { Indicator as IndicatorModel, PrismaClient } from '@prisma/client';
import { Indicator } from '../../../domain/entities/Indicator.js';
import type { IndicatorRepository } from '../../../domain/repositories/IndicatorRepository.js';

export class PrismaIndicatorRepository implements IndicatorRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(indicator: Indicator): Promise<void> {
    await this.prisma.indicator.create({
      data: {
        id: indicator.id,
        name: indicator.name,
        createdAt: indicator.createdAt,
      },
    });
  }

  async findById(id: string): Promise<Indicator | null> {
    const row = await this.prisma.indicator.findUnique({ where: { id } });

    return row ? this.toDomain(row) : null;
  }

  async findByName(name: string): Promise<Indicator | null> {
    const row = await this.prisma.indicator.findUnique({ where: { name } });

    return row ? this.toDomain(row) : null;
  }

  async findMany(): Promise<Indicator[]> {
    const rows = await this.prisma.indicator.findMany();

    return rows.map((row) => this.toDomain(row));
  }

  private toDomain(row: IndicatorModel): Indicator {
    return Indicator.restore({
      id: row.id,
      name: row.name,
      createdAt: row.createdAt,
    });
  }
}
