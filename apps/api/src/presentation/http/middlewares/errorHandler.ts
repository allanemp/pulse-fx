import type { ApiErrorResponse } from '@pulse-fx/shared';
import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { DomainError } from '../../../domain/errors/DomainError.js';
import { logger } from '../../../infrastructure/logging/logger.js';

/**
 * Middleware de erro centralizado — único lugar que decide como cada tipo
 * de falha vira uma resposta HTTP.
 *
 * Precisa ser o último middleware registrado e ter exatamente 4 parâmetros
 * para o Express reconhecê-lo como error handler.
 */
export function errorHandler(
  error: unknown,
  req: Request,
  res: Response<ApiErrorResponse>,
  _next: NextFunction,
): void {
  if (error instanceof ZodError) {
    res.status(400).json({
      message: 'Dados de entrada inválidos.',
      details: error.flatten().fieldErrors as Record<string, string[]>,
    });
    return;
  }

  if (error instanceof DomainError) {
    res.status(422).json({ message: error.message });
    return;
  }

  logger.error({ err: error, path: req.path, method: req.method }, 'Erro não tratado');

  res.status(500).json({ message: 'Erro interno do servidor.' });
}
