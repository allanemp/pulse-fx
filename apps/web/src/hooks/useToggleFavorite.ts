import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { IndicatorDTO } from '@pulse-fx/shared';
import { indicatorsApi } from '../api/indicatorsApi';
import { indicatorKeys } from '../api/queryKeys';

/**
 * Marca/desmarca um indicador como favorito, com atualização otimista da
 * lista em cache — o card reage no clique, sem esperar a resposta da API,
 * e desfaz sozinho se a chamada falhar.
 */
export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ indicatorId, isFavorite }: { indicatorId: string; isFavorite: boolean }) =>
      isFavorite
        ? indicatorsApi.unmarkFavorite(indicatorId)
        : indicatorsApi.markFavorite(indicatorId),

    onMutate: async ({ indicatorId, isFavorite }) => {
      await queryClient.cancelQueries({ queryKey: indicatorKeys.lists() });

      const previousIndicators = queryClient.getQueryData<IndicatorDTO[]>(indicatorKeys.lists());

      queryClient.setQueryData<IndicatorDTO[]>(indicatorKeys.lists(), (indicators) =>
        indicators?.map((indicator) =>
          indicator.id === indicatorId ? { ...indicator, isFavorite: !isFavorite } : indicator,
        ),
      );

      return { previousIndicators };
    },

    onError: (_error, _variables, context) => {
      if (context?.previousIndicators) {
        queryClient.setQueryData(indicatorKeys.lists(), context.previousIndicators);
      }
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: indicatorKeys.lists() });
    },
  });
}
