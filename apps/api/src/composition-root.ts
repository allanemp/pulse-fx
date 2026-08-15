import { GetLatestExchangeRate } from './application/use-cases/GetLatestExchangeRate.js';
import { ListExchangeRates } from './application/use-cases/ListExchangeRates.js';
import { ListIndicators } from './application/use-cases/ListIndicators.js';
import { ListObservations } from './application/use-cases/ListObservations.js';
import { RegisterExchangeRate } from './application/use-cases/RegisterExchangeRate.js';
import { RegisterIndicator } from './application/use-cases/RegisterIndicator.js';
import { RegisterObservation } from './application/use-cases/RegisterObservation.js';
import { prisma } from './infrastructure/database/prisma/client.js';
import { PrismaExchangeRateRepository } from './infrastructure/database/repositories/PrismaExchangeRateRepository.js';
import { PrismaIndicatorRepository } from './infrastructure/database/repositories/PrismaIndicatorRepository.js';
import { PrismaObservationRepository } from './infrastructure/database/repositories/PrismaObservationRepository.js';
import { createApp } from './presentation/http/app.js';
import { ExchangeRateController } from './presentation/http/controllers/ExchangeRateController.js';
import { IndicatorController } from './presentation/http/controllers/IndicatorController.js';
import { ObservationController } from './presentation/http/controllers/ObservationController.js';

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

  const indicatorRepository = new PrismaIndicatorRepository(prisma);
  const observationRepository = new PrismaObservationRepository(prisma);

  const registerIndicator = new RegisterIndicator(indicatorRepository);
  const listIndicators = new ListIndicators(indicatorRepository);
  const registerObservation = new RegisterObservation(observationRepository, indicatorRepository);
  const listObservations = new ListObservations(observationRepository, indicatorRepository);

  const indicatorController = new IndicatorController(registerIndicator, listIndicators);
  const observationController = new ObservationController(registerObservation, listObservations);

  return createApp({ exchangeRateController, indicatorController, observationController });
}
