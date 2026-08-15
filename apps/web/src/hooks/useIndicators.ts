import { useQuery } from '@tanstack/react-query';
import { indicatorsApi } from '../api/indicatorsApi';
import { indicatorKeys } from '../api/queryKeys';

/** Lista os indicadores cadastrados no catálogo. */
export function useIndicators() {
  return useQuery({
    queryKey: indicatorKeys.lists(),
    queryFn: indicatorsApi.list,
  });
}
