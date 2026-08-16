import type { IndicatorDTO, ObservationDTO } from '@pulse-fx/shared';
import type { RegisterIndicatorInput } from './application/use-cases/RegisterIndicator.js';
import { GetLatestExchangeRate } from './application/use-cases/GetLatestExchangeRate.js';
import { GetLatestObservation } from './application/use-cases/GetLatestObservation.js';
import { ListExchangeRates } from './application/use-cases/ListExchangeRates.js';
import { ListIndicators } from './application/use-cases/ListIndicators.js';
import type { ListObservationsInput } from './application/use-cases/ListObservations.js';
import { ListObservations } from './application/use-cases/ListObservations.js';
import { ListSyncableIndicatorIds } from './application/use-cases/ListSyncableIndicatorIds.js';
import type { MarkIndicatorAsFavoriteInput } from './application/use-cases/MarkIndicatorAsFavorite.js';
import { MarkIndicatorAsFavorite } from './application/use-cases/MarkIndicatorAsFavorite.js';
import { RegisterExchangeRate } from './application/use-cases/RegisterExchangeRate.js';
import { RegisterIndicator } from './application/use-cases/RegisterIndicator.js';
import type { RegisterObservationInput } from './application/use-cases/RegisterObservation.js';
import { RegisterObservation } from './application/use-cases/RegisterObservation.js';
import type {
  SyncIndicatorObservationsInput,
  SyncIndicatorObservationsResult,
} from './application/use-cases/SyncIndicatorObservations.js';
import { SyncIndicatorObservations } from './application/use-cases/SyncIndicatorObservations.js';
import type { UnmarkIndicatorAsFavoriteInput } from './application/use-cases/UnmarkIndicatorAsFavorite.js';
import { UnmarkIndicatorAsFavorite } from './application/use-cases/UnmarkIndicatorAsFavorite.js';
import { CacheInvalidatingCommand } from './infrastructure/cache/CacheInvalidatingCommand.js';
import { cacheKeys } from './infrastructure/cache/cacheKeys.js';
import { CachedQuery } from './infrastructure/cache/CachedQuery.js';
import { CachedQueryWithInput } from './infrastructure/cache/CachedQueryWithInput.js';
import { RedisCache } from './infrastructure/cache/RedisCache.js';
import { env } from './infrastructure/config/env.js';
import { prisma } from './infrastructure/database/prisma/client.js';
import { PrismaExchangeRateRepository } from './infrastructure/database/repositories/PrismaExchangeRateRepository.js';
import { PrismaFavoriteRepository } from './infrastructure/database/repositories/PrismaFavoriteRepository.js';
import { PrismaIndicatorRepository } from './infrastructure/database/repositories/PrismaIndicatorRepository.js';
import { PrismaObservationRepository } from './infrastructure/database/repositories/PrismaObservationRepository.js';
import { MapIndicatorDataSourceRegistry } from './infrastructure/gateways/IndicatorDataSourceRegistry.js';
import { createIndicatorSyncWorker } from './infrastructure/queue/indicatorSyncWorker.js';
import { redisConnection } from './infrastructure/redis/redisConnection.js';
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

  // Cache de leitura (Redis) pros dois endpoints mais consultados pelo
  // dashboard — GET /api/indicators (toda carga da tela) e
  // GET /api/indicators/{id}/observations (todo card + o modal de
  // detalhes). Ver infrastructure/cache: cada caso de uso de escrita que
  // afeta esses dados é envolvido por um CacheInvalidatingCommand, então o
  // TTL é só uma rede de segurança, não o mecanismo principal de correção.
  const cache = new RedisCache(redisConnection);

  const registerIndicator = new CacheInvalidatingCommand<RegisterIndicatorInput, IndicatorDTO>(
    new RegisterIndicator(indicatorRepository),
    cache,
    () => cacheKeys.indicatorsList(),
  );
  const listIndicators = new CachedQuery<IndicatorDTO[]>(
    new ListIndicators(indicatorRepository, favoriteRepository),
    cache,
    cacheKeys.indicatorsList(),
    env.CACHE_TTL_SECONDS,
  );
  const registerObservation = new CacheInvalidatingCommand<RegisterObservationInput, ObservationDTO>(
    new RegisterObservation(observationRepository, indicatorRepository),
    cache,
    (input) => cacheKeys.observationsPrefix(input.indicatorId),
  );
  const listObservations = new CachedQueryWithInput<ListObservationsInput, ObservationDTO[]>(
    new ListObservations(observationRepository, indicatorRepository),
    cache,
    (input) => cacheKeys.observationsList(input.indicatorId, input.from, input.to),
    env.CACHE_TTL_SECONDS,
  );
  const getLatestObservation = new GetLatestObservation(observationRepository, indicatorRepository);
  const markIndicatorAsFavorite = new CacheInvalidatingCommand<MarkIndicatorAsFavoriteInput, void>(
    new MarkIndicatorAsFavorite(favoriteRepository, indicatorRepository),
    cache,
    () => cacheKeys.indicatorsList(),
  );
  const unmarkIndicatorAsFavorite = new CacheInvalidatingCommand<
    UnmarkIndicatorAsFavoriteInput,
    void
  >(new UnmarkIndicatorAsFavorite(favoriteRepository), cache, () => cacheKeys.indicatorsList());

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
  const cache = new RedisCache(redisConnection);

  const listSyncableIndicatorIds = new ListSyncableIndicatorIds(indicatorRepository);
  // A sincronização diária escreve observações novas por fora da API — sem
  // isso, o cache de GET /observations ficaria com dados velhos até o TTL
  // expirar, mesmo com o banco já atualizado.
  const syncIndicatorObservations = new CacheInvalidatingCommand<
    SyncIndicatorObservationsInput,
    SyncIndicatorObservationsResult
  >(
    new SyncIndicatorObservations(observationRepository, indicatorRepository, dataSourceRegistry),
    cache,
    (input) => cacheKeys.observationsPrefix(input.indicatorId),
  );

  return createIndicatorSyncWorker({ listSyncableIndicatorIds, syncIndicatorObservations });
}
