import { Router } from 'express';
import type { ObservationController } from '../controllers/ObservationController.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';

/**
 * Rotas aninhadas sob `/api/indicators/:indicatorId/observations` — precisa
 * de `mergeParams: true` para enxergar o `:indicatorId` definido no router pai.
 */
export function observationRoutes(controller: ObservationController): Router {
  const router = Router({ mergeParams: true });

  router.post('/', asyncHandler(controller.create));
  router.get('/', asyncHandler(controller.list));
  router.get('/latest', asyncHandler(controller.latest));

  return router;
}
