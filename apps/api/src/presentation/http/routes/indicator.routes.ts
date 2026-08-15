import { Router } from 'express';
import type { IndicatorController } from '../controllers/IndicatorController.js';
import type { ObservationController } from '../controllers/ObservationController.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { observationRoutes } from './observation.routes.js';

export function indicatorRoutes(
  indicatorController: IndicatorController,
  observationController: ObservationController,
): Router {
  const router = Router();

  router.post('/', asyncHandler(indicatorController.create));
  router.get('/', asyncHandler(indicatorController.list));
  router.put('/:indicatorId/favorite', asyncHandler(indicatorController.markFavorite));
  router.delete('/:indicatorId/favorite', asyncHandler(indicatorController.unmarkFavorite));
  router.use('/:indicatorId/observations', observationRoutes(observationController));

  return router;
}
