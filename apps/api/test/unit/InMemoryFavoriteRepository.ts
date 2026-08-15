import type { Favorite } from '../../src/domain/entities/Favorite.js';
import type { FavoriteRepository } from '../../src/domain/repositories/FavoriteRepository.js';

/** Fake em memória do repositório de favoritos, usado apenas em testes. */
export class InMemoryFavoriteRepository implements FavoriteRepository {
  public readonly items: Favorite[] = [];

  async add(favorite: Favorite): Promise<void> {
    const alreadyFavorited = this.items.some((item) => item.indicatorId === favorite.indicatorId);

    if (!alreadyFavorited) {
      this.items.push(favorite);
    }
  }

  async remove(indicatorId: string): Promise<void> {
    const index = this.items.findIndex((item) => item.indicatorId === indicatorId);

    if (index !== -1) {
      this.items.splice(index, 1);
    }
  }

  async findFavoriteIndicatorIds(): Promise<string[]> {
    return this.items.map((item) => item.indicatorId);
  }
}
