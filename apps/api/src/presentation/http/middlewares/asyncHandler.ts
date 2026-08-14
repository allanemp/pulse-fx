import type { NextFunction, Request, RequestHandler, Response } from 'express';

/**
 * Encaminha rejeições de handlers assíncronos para o `errorHandler`.
 *
 * O Express 4 não faz isso automaticamente: sem este wrapper, uma exceção
 * lançada dentro de um `async (req, res) => ...` derrubaria a requisição
 * silenciosamente em vez de cair no middleware de erro centralizado.
 */
export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<void>,
): RequestHandler {
  return (req, res, next) => {
    handler(req, res, next).catch(next);
  };
}
