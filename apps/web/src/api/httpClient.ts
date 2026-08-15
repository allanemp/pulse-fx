import type { ApiErrorResponse } from '@pulse-fx/shared';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333';
const API_TOKEN = import.meta.env.VITE_API_TOKEN;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Cliente HTTP fino sobre `fetch`. Centraliza a URL base e a tradução de
 * respostas de erro do backend (`ApiErrorResponse`) em `ApiError`, para que
 * os componentes de UI não precisem conhecer o formato de erro da API.
 */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_TOKEN}`,
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiErrorResponse | null;
    throw new ApiError(
      body?.message ?? 'Falha na comunicação com a API.',
      response.status,
      body?.details,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const httpClient = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
};
