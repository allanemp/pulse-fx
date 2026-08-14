import { Router } from 'express';
import type { ExchangeRateController } from '../controllers/ExchangeRateController.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';

export function exchangeRateRoutes(controller: ExchangeRateController): Router {
  const router = Router();

  router.post('/', asyncHandler(controller.create));
  router.get('/', asyncHandler(controller.list));
  router.get('/latest', asyncHandler(controller.latest));

  return router;
}
