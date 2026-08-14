import { QueryClient } from '@tanstack/react-query';

/**
 * Instância única do QueryClient, compartilhada por toda a aplicação.
 *
 * `staleTime` maior que o padrão (0) evita refetches redundantes ao
 * navegar entre telas que leem os mesmos dados; `refetchOnWindowFocus`
 * desligado porque cotações não mudam por interação externa ao app.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
