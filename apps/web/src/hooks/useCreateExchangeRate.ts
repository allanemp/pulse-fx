import { useMutation, useQueryClient } from '@tanstack/react-query';
import { exchangeRatesApi } from '../api/exchangeRatesApi';
import { exchangeRateKeys } from '../api/queryKeys';

/**
 * Registra uma nova cotação e invalida o cache da listagem em caso de
 * sucesso, para que a UI reflita o dado recém-criado sem refetch manual.
 */
export function useCreateExchangeRate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: exchangeRatesApi.create,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: exchangeRateKeys.lists() });
    },
  });
}
