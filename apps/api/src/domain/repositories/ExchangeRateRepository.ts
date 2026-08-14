import type { ExchangeRate } from '../entities/ExchangeRate.js';
import type { CurrencyPair } from '../value-objects/CurrencyPair.js';

export interface ExchangeRateFilter {
  pair?: CurrencyPair;
}

/**
 * Porta (interface) que o domínio/aplicação depende para persistir e
 * consultar cotações — Dependency Inversion Principle: a camada de
 * aplicação não conhece Prisma, PostgreSQL ou qualquer detalhe de
 * infraestrutura, apenas este contrato.
 *
 * A implementação concreta mora em
 * `src/infrastructure/database/repositories/PrismaExchangeRateRepository.ts`.
 */
export interface ExchangeRateRepository {
  save(exchangeRate: ExchangeRate): Promise<void>;
  findMany(filter?: ExchangeRateFilter): Promise<ExchangeRate[]>;
  findLatestByPair(pair: CurrencyPair): Promise<ExchangeRate | null>;
}
