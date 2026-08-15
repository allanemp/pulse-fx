import type { Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { apiTokenAuth } from '../../src/presentation/http/middlewares/apiTokenAuth.js';

const EXPECTED_TOKEN = 'a3c195592e348f4e83eaa82956c6d077cc747c3852b6daa44fd64214ec3c294b';

function buildResponseMock() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res as unknown as Response;
}

function buildRequestMock(authorizationHeader?: string): Request {
  return { header: vi.fn().mockReturnValue(authorizationHeader) } as unknown as Request;
}

describe('apiTokenAuth (middleware)', () => {
  it('chama next() quando o token no header bate com o esperado', () => {
    const middleware = apiTokenAuth(EXPECTED_TOKEN);
    const req = buildRequestMock(`Bearer ${EXPECTED_TOKEN}`);
    const res = buildResponseMock();
    const next = vi.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('responde 401 quando o header Authorization está ausente', () => {
    const middleware = apiTokenAuth(EXPECTED_TOKEN);
    const req = buildRequestMock(undefined);
    const res = buildResponseMock();
    const next = vi.fn();

    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('responde 401 quando o header não usa o prefixo "Bearer "', () => {
    const middleware = apiTokenAuth(EXPECTED_TOKEN);
    const req = buildRequestMock(EXPECTED_TOKEN);
    const res = buildResponseMock();
    const next = vi.fn();

    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('responde 401 quando o token não bate (tamanho igual)', () => {
    const middleware = apiTokenAuth(EXPECTED_TOKEN);
    const wrongTokenSameLength = 'b'.repeat(EXPECTED_TOKEN.length);
    const req = buildRequestMock(`Bearer ${wrongTokenSameLength}`);
    const res = buildResponseMock();
    const next = vi.fn();

    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('responde 401 quando o token não bate (tamanho diferente)', () => {
    const middleware = apiTokenAuth(EXPECTED_TOKEN);
    const req = buildRequestMock('Bearer curto');
    const res = buildResponseMock();
    const next = vi.fn();

    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });
});
