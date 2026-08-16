// @vitest-environment jsdom
import type { IndicatorDTO } from '@pulse-fx/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { indicatorsApi } from '../api/indicatorsApi';
import { indicatorKeys } from '../api/queryKeys';
import { useToggleFavorite } from './useToggleFavorite';

vi.mock('../api/indicatorsApi', () => ({
  indicatorsApi: {
    markFavorite: vi.fn(),
    unmarkFavorite: vi.fn(),
  },
}));

const INDICATORS: IndicatorDTO[] = [
  {
    id: 'a',
    name: 'Selic',
    frequency: 'monthly',
    isFavorite: false,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'b',
    name: 'IPCA',
    frequency: 'monthly',
    isFavorite: false,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

function setup() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  queryClient.setQueryData(indicatorKeys.lists(), INDICATORS);

  function wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  return { queryClient, wrapper };
}

function getCachedIndicator(queryClient: QueryClient, id: string) {
  const indicators = queryClient.getQueryData<IndicatorDTO[]>(indicatorKeys.lists());
  return indicators?.find((indicator) => indicator.id === id);
}

describe('useToggleFavorite', () => {
  beforeEach(() => {
    vi.mocked(indicatorsApi.markFavorite).mockReset();
    vi.mocked(indicatorsApi.unmarkFavorite).mockReset();
  });

  it('atualiza isFavorite no cache na hora (otimista), antes da API responder', async () => {
    // Nunca resolve — só quero observar o estado logo após o onMutate, sem
    // deixar a mutation inteira terminar ainda.
    vi.mocked(indicatorsApi.markFavorite).mockReturnValue(new Promise(() => {}));
    const { queryClient, wrapper } = setup();
    const { result } = renderHook(() => useToggleFavorite(), { wrapper });

    result.current.mutate({ indicatorId: 'a', isFavorite: false });

    await waitFor(() => {
      expect(getCachedIndicator(queryClient, 'a')?.isFavorite).toBe(true);
    });
    // O outro indicador não deve ser afetado.
    expect(getCachedIndicator(queryClient, 'b')?.isFavorite).toBe(false);
  });

  it('desfaz a atualização otimista no cache se a API falhar', async () => {
    vi.mocked(indicatorsApi.markFavorite).mockRejectedValue(new Error('falhou'));
    const { queryClient, wrapper } = setup();
    const { result } = renderHook(() => useToggleFavorite(), { wrapper });

    result.current.mutate({ indicatorId: 'a', isFavorite: false });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(getCachedIndicator(queryClient, 'a')?.isFavorite).toBe(false);
  });

  it('chama unmarkFavorite quando o indicador já está favoritado', async () => {
    vi.mocked(indicatorsApi.unmarkFavorite).mockResolvedValue(undefined);
    const { wrapper } = setup();
    const { result } = renderHook(() => useToggleFavorite(), { wrapper });

    result.current.mutate({ indicatorId: 'a', isFavorite: true });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(indicatorsApi.unmarkFavorite).toHaveBeenCalledWith('a');
    expect(indicatorsApi.markFavorite).not.toHaveBeenCalled();
  });
});
