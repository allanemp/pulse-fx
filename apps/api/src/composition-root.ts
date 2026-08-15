import { GetLatestExchangeRate } from './application/use-cases/GetLatestExchangeRate.js';
import { GetLatestObservation } from './application/use-cases/GetLatestObservation.js';
import { ListExchangeRates } from './application/use-cases/ListExchangeRates.js';
import { ListIndicators } from './application/use-cases/ListIndicators.js';
import { ListObservations } from './application/use-cases/ListObservations.js';
import { ListSyncableIndicatorIds } from './application/use-cases/ListSyncableIndicatorIds.js';
import { MarkIndicatorAsFavorite } from './application/use-cases/MarkIndicatorAsFavorite.js';
import { RegisterExchangeRate } from './application/use-cases/RegisterExchangeRate.js';
import { RegisterIndicator } from './application/use-cases/RegisterIndicator.js';
import { RegisterObservation } from './application/use-cases/RegisterObservation.js';
import { SyncIndicatorObservations } from './application/use-cases/SyncIndicatorObservations.js';
import { UnmarkIndicatorAsFavorite } from './application/use-cases/UnmarkIndicatorAsFavorite.js';
import { prisma } from './infrastructure/database/prisma/client.js';
import { PrismaExchangeRateRepository } from './infrastructure/database/repositories/PrismaExchangeRateRepository.js';
import { PrismaFavoriteRepository } from './infrastructure/database/repositories/PrismaFavoriteRepository.js';
import { PrismaIndicatorRepository } from './infrastructure/database/repositories/PrismaIndicatorRepository.js';
import { PrismaObservationRepository } from './infrastructure/database/repositories/PrismaObservationRepository.js';
import { MapIndicatorDataSourceRegistry } from './infrastructure/gateways/IndicatorDataSourceRegistry.js';
import { createIndicatorSyncWorker } from './infrastructure/queue/indicatorSyncWorker.js';
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
  const favoriteRepository = new PrismaFavoriteRepository(prisma);

  const registerIndicator = new RegisterIndicator(indicatorRepository);
  const listIndicators = new ListIndicators(indicatorRepository, favoriteRepository);
  const registerObservation = new RegisterObservation(observationRepository, indicatorRepository);
  const listObservations = new ListObservations(observationRepository, indicatorRepository);
  const getLatestObservation = new GetLatestObservation(observationRepository, indicatorRepository);
  const markIndicatorAsFavorite = new MarkIndicatorAsFavorite(
    favoriteRepository,
    indicatorRepository,
  );
  const unmarkIndicatorAsFavorite = new UnmarkIndicatorAsFavorite(favoriteRepository);

  const indicatorController = new IndicatorController(
    registerIndicator,
    listIndicators,
    markIndicatorAsFavorite,
    unmarkIndicatorAsFavorite,
  );
  const observationController = new ObservationController(
    registerObservation,
    listObservations,
    getLatestObservation,
  );

  return createApp({ exchangeRateController, indicatorController, observationController });
}

/**
 * Constrói o worker BullMQ que processa a fila `indicator-sync` (ver
 * `infrastructure/queue`). Chamado uma vez na inicialização do servidor
 * (`server.ts`), à parte de `buildApp()` — roda no mesmo processo da API,
 * não como um serviço separado, por simplicidade nesta fase do projeto.
 */
export function buildIndicatorSyncWorker() {
  const indicatorRepository = new PrismaIndicatorRepository(prisma);
  const observationRepository = new PrismaObservationRepository(prisma);
  const dataSourceRegistry = new MapIndicatorDataSourceRegistry();

  const listSyncableIndicatorIds = new ListSyncableIndicatorIds(indicatorRepository);
  const syncIndicatorObservations = new SyncIndicatorObservations(
    observationRepository,
    indicatorRepository,
    dataSourceRegistry,
  );

  return createIndicatorSyncWorker({ listSyncableIndicatorIds, syncIndicatorObservations });
}
