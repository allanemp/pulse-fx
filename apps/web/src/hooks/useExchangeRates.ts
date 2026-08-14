import { useQuery } from '@tanstack/react-query';
import { exchangeRatesApi } from '../api/exchangeRatesApi';
import { exchangeRateKeys } from '../api/queryKeys';

/**
 * Lista as cotações registradas, com cache gerenciado pelo TanStack Query
 * (evita refetch em toda renderização e compartilha o resultado entre
 * qualquer componente que use este hook).
 */
export function useExchangeRates() {
  return useQuery({
    queryKey: exchangeRateKeys.lists(),
    queryFn: exchangeRatesApi.list,
  });
}
