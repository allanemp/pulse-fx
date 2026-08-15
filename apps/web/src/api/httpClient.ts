import type { ApiErrorResponse } from '@pulse-fx/shared';
import axios, { AxiosError } from 'axios';

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

const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${API_TOKEN}`,
  },
});

/**
 * Traduz qualquer erro do Axios (a API respondeu com erro, ou a requisição
 * nem chegou a sair) em `ApiError`, num único lugar — os componentes de UI
 * não precisam conhecer o formato de erro da API nem do Axios.
 */
client.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (error instanceof AxiosError) {
      const body = error.response?.data as ApiErrorResponse | undefined;

      throw new ApiError(
        body?.message ?? 'Falha na comunicação com a API.',
        error.response?.status ?? 0,
        body?.details,
      );
    }

    throw error;
  },
);

export const httpClient = {
  get: async <T>(path: string): Promise<T> => (await client.get<T>(path)).data,
  post: async <T>(path: string, body: unknown): Promise<T> => (await client.post<T>(path, body)).data,
  put: async <T>(path: string): Promise<T> => (await client.put<T>(path)).data,
  delete: async <T>(path: string): Promise<T> => (await client.delete<T>(path)).data,
};
