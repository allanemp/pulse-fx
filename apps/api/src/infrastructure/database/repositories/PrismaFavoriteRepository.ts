import type { PrismaClient } from '@prisma/client';
import type { Favorite } from '../../../domain/entities/Favorite.js';
import type { FavoriteRepository } from '../../../domain/repositories/FavoriteRepository.js';

export class PrismaFavoriteRepository implements FavoriteRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async add(favorite: Favorite): Promise<void> {
    // upsert em vez de create: marcar um indicador já favoritado deve ser
    // um no-op, não um erro de constraint única.
    await this.prisma.favorite.upsert({
      where: { indicatorId: favorite.indicatorId },
      update: {},
      create: {
        id: favorite.id,
        indicatorId: favorite.indicatorId,
        createdAt: favorite.createdAt,
      },
    });
  }

  async remove(indicatorId: string): Promise<void> {
    await this.prisma.favorite.deleteMany({ where: { indicatorId } });
  }

  async findFavoriteIndicatorIds(): Promise<string[]> {
    const rows = await this.prisma.favorite.findMany({ select: { indicatorId: true } });

    return rows.map((row) => row.indicatorId);
  }
}
