import type { Favorite } from '../entities/Favorite.js';

/**
 * Porta que o domínio/aplicação depende para marcar/consultar favoritos — a
 * implementação concreta (Prisma) mora em
 * `src/infrastructure/database/repositories/PrismaFavoriteRepository.ts`.
 */
export interface FavoriteRepository {
  /** Idempotente: marcar um indicador já favorito não deve falhar nem duplicar. */
  add(favorite: Favorite): Promise<void>;
  /** Idempotente: desmarcar um indicador que não está favoritado não deve falhar. */
  remove(indicatorId: string): Promise<void>;
  /** IDs de todos os indicadores favoritados — usado para marcar `isFavorite` em listagens sem N+1. */
  findFavoriteIndicatorIds(): Promise<string[]>;
}
