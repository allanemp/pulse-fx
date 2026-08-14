import type { ExchangeRate as ExchangeRateModel, PrismaClient } from '@prisma/client';
import { ExchangeRate } from '../../../domain/entities/ExchangeRate.js';
import type {
  ExchangeRateFilter,
  ExchangeRateRepository,
} from '../../../domain/repositories/ExchangeRateRepository.js';
import { CurrencyPair } from '../../../domain/value-objects/CurrencyPair.js';

/**
 * Implementação do repositório de cotações usando Prisma + PostgreSQL.
 *
 * Único ponto do sistema que conhece o formato de persistência (Decimal,
 * nomes de coluna, etc.) — a conversão de/para a entidade de domínio
 * acontece inteiramente aqui.
 */
export class PrismaExchangeRateRepository implements ExchangeRateRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(exchangeRate: ExchangeRate): Promise<void> {
    await this.prisma.exchangeRate.create({
      data: {
        id: exchangeRate.id,
        baseCurrency: exchangeRate.pair.base,
        quoteCurrency: exchangeRate.pair.quote,
        rate: exchangeRate.rate,
        capturedAt: exchangeRate.capturedAt,
        createdAt: exchangeRate.createdAt,
      },
    });
  }

  async findMany(filter?: ExchangeRateFilter): Promise<ExchangeRate[]> {
    const rows = await this.prisma.exchangeRate.findMany({
      ...(filter?.pair
        ? { where: { baseCurrency: filter.pair.base, quoteCurrency: filter.pair.quote } }
        : {}),
      orderBy: { capturedAt: 'desc' },
    });

    return rows.map((row) => this.toDomain(row));
  }

  async findLatestByPair(pair: CurrencyPair): Promise<ExchangeRate | null> {
    const row = await this.prisma.exchangeRate.findFirst({
      where: { baseCurrency: pair.base, quoteCurrency: pair.quote },
      orderBy: { capturedAt: 'desc' },
    });

    return row ? this.toDomain(row) : null;
  }

  private toDomain(row: ExchangeRateModel): ExchangeRate {
    return ExchangeRate.restore({
      id: row.id,
      pair: CurrencyPair.create(row.baseCurrency, row.quoteCurrency),
      rate: Number(row.rate),
      capturedAt: row.capturedAt,
      createdAt: row.createdAt,
    });
  }
}
