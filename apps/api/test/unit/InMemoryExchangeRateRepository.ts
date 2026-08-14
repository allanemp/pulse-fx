import type { ExchangeRate } from '../../src/domain/entities/ExchangeRate.js';
import type {
  ExchangeRateFilter,
  ExchangeRateRepository,
} from '../../src/domain/repositories/ExchangeRateRepository.js';

/**
 * Fake em memória do repositório, usado apenas em testes.
 *
 * Existir é a prova de que a camada de aplicação depende de uma abstração
 * (`ExchangeRateRepository`), não do Prisma — por isso os casos de uso são
 * testáveis sem subir um PostgreSQL.
 */
export class InMemoryExchangeRateRepository implements ExchangeRateRepository {
  public readonly items: ExchangeRate[] = [];

  async save(exchangeRate: ExchangeRate): Promise<void> {
    this.items.push(exchangeRate);
  }

  async findMany(filter?: ExchangeRateFilter): Promise<ExchangeRate[]> {
    if (!filter?.pair) {
      return [...this.items];
    }

    return this.items.filter((item) => item.pair.equals(filter.pair!));
  }

  async findLatestByPair(pair: ExchangeRate['pair']): Promise<ExchangeRate | null> {
    const matches = this.items
      .filter((item) => item.pair.equals(pair))
      .sort((a, b) => b.capturedAt.getTime() - a.capturedAt.getTime());

    return matches[0] ?? null;
  }
}
