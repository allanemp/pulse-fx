import { GetLatestExchangeRate } from './application/use-cases/GetLatestExchangeRate.js';
import { ListExchangeRates } from './application/use-cases/ListExchangeRates.js';
import { RegisterExchangeRate } from './application/use-cases/RegisterExchangeRate.js';
import { prisma } from './infrastructure/database/prisma/client.js';
import { PrismaExchangeRateRepository } from './infrastructure/database/repositories/PrismaExchangeRateRepository.js';
import { ExchangeRateController } from './presentation/http/controllers/ExchangeRateController.js';
import { createApp } from './presentation/http/app.js';

/**
 * Composition root: único lugar do projeto onde implementações concretas de
 * infraestrutura são amarradas às abstrações usadas pela aplicação (Dependency
 * Injection manual, sem framework de DI). Trocar Prisma por outra tecnologia
 * de persistência afeta apenas este arquivo e a pasta `infrastructure/`.
 */
export function buildApp() {
  const exchangeRateRepository = new PrismaExchangeRateRepository(prisma);

  const registerExchangeRate = new RegisterExchangeRate(exchangeRateRepository);
  const listExchangeRates = new ListExchangeRates(exchangeRateRepository);
  const getLatestExchangeRate = new GetLatestExchangeRate(exchangeRateRepository);

  const exchangeRateController = new ExchangeRateController(
    registerExchangeRate,
    listExchangeRates,
    getLatestExchangeRate,
  );

  return createApp({ exchangeRateController });
}
