import { useQuery } from '@tanstack/react-query';
import { indicatorsApi } from '../api/indicatorsApi';
import { observationKeys } from '../api/queryKeys';

/**
 * Série histórica completa de um indicador (ordenada por data crescente).
 *
 * Usada tanto para calcular o card do dashboard (valor mais recente,
 * variação vs. anterior) quanto para a tabela histórica do modal de
 * detalhes — os dois compartilham o mesmo cache do TanStack Query (mesma
 * query key), então abrir o modal não dispara um novo fetch.
 */
export function useObservations(indicatorId: string, enabled = true) {
  return useQuery({
    queryKey: observationKeys.list(indicatorId),
    queryFn: () => indicatorsApi.observations(indicatorId),
    enabled,
  });
}
