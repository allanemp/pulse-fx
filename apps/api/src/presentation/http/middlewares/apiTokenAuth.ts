import { timingSafeEqual } from 'node:crypto';
import type { NextFunction, Request, RequestHandler, Response } from 'express';

const BEARER_PREFIX = 'Bearer ';

function isValidToken(provided: string, expected: string): boolean {
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);

  // Buffers de tamanhos diferentes fariam `timingSafeEqual` lançar — e o próprio
  // tamanho já denuncia um token errado, então trata como inválido direto.
  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(providedBuffer, expectedBuffer);
}

/**
 * Middleware factory: exige `Authorization: Bearer <expectedToken>` na requisição.
 * Recebe o token esperado por parâmetro (em vez de importar `env` diretamente)
 * para ficar testável em isolamento, no mesmo espírito da injeção de
 * dependência usada nos casos de uso.
 *
 * Protege contra scraping casual e chamadas de terceiros não autorizados,
 * mas não é autenticação de usuário: como o frontend é uma SPA pública, o
 * token embutido no bundle é extraível por qualquer pessoa que inspecione o
 * JS servido — combina com CORS (`cors()` em `app.ts`) para reduzir a
 * superfície de abuso, não para eliminá-la.
 */
export function apiTokenAuth(expectedToken: string): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const header = req.header('authorization');

    if (!header || !header.startsWith(BEARER_PREFIX)) {
      res.status(401).json({
        message: 'Token de API ausente. Envie "Authorization: Bearer <token>".',
      });
      return;
    }

    const token = header.slice(BEARER_PREFIX.length);

    if (!isValidToken(token, expectedToken)) {
      res.status(401).json({ message: 'Token de API inválido.' });
      return;
    }

    next();
  };
}
