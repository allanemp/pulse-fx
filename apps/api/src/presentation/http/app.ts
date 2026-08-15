import cors from 'cors';
import express, { type Express } from 'express';
import { pinoHttp } from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import { env } from '../../infrastructure/config/env.js';
import { logger } from '../../infrastructure/logging/logger.js';
import type { ExchangeRateController } from './controllers/ExchangeRateController.js';
import type { IndicatorController } from './controllers/IndicatorController.js';
import type { ObservationController } from './controllers/ObservationController.js';
import { openApiSpec } from './docs/openapiSpec.js';
import { apiTokenAuth } from './middlewares/apiTokenAuth.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { exchangeRateRoutes } from './routes/exchangeRate.routes.js';
import { healthRoutes } from './routes/health.routes.js';
import { indicatorRoutes } from './routes/indicator.routes.js';

/**
 * Monta a aplicação Express. Recebe os controllers já construídos (ver
 * `composition-root.ts`) em vez de instanciá-los aqui — mantém esta camada
 * responsável apenas por fiação HTTP (middlewares, rotas, tratamento de erro).
 */
export function createApp(deps: {
  exchangeRateController: ExchangeRateController;
  indicatorController: IndicatorController;
  observationController: ObservationController;
}): Express {
  const app = express();

  app.use(cors({ origin: env.CORS_ORIGIN }));
  app.use(express.json());
  app.use(pinoHttp({ logger, autoLogging: env.NODE_ENV !== 'test' }));

  app.use('/health', healthRoutes());

  // Tudo sob /api exige o token compartilhado com o frontend (ver apiTokenAuth).
  app.use('/api', apiTokenAuth(env.API_TOKEN));
  app.use('/api/exchange-rates', exchangeRateRoutes(deps.exchangeRateController));
  app.use('/api/indicators', indicatorRoutes(deps.indicatorController, deps.observationController));

  app.get('/docs/openapi.json', (_req, res) => {
    res.status(200).json(openApiSpec);
  });
  app.use(
    '/docs',
    swaggerUi.serve,
    swaggerUi.setup(openApiSpec, { customSiteTitle: 'Pulse FX API — Docs' }),
  );

  app.use((_req, res) => {
    res.status(404).json({ message: 'Recurso não encontrado.' });
  });

  app.use(errorHandler);

  return app;
}
