import { Router } from 'express';

/**
 * Rota de health check, usada pelo `HEALTHCHECK` do Docker e por orquestradores.
 */
export function healthRoutes(): Router {
  const router = Router();

  router.get('/', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  return router;
}
