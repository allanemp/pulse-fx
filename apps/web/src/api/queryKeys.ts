/**
 * Fábrica de query keys do domínio de cotações — mantém as chaves usadas
 * por `useQuery`/`useMutation`/invalidação em um único lugar, evitando
 * strings mágicas espalhadas pelos hooks.
 */
export const exchangeRateKeys = {
  all: ['exchange-rates'] as const,
  lists: () => [...exchangeRateKeys.all, 'list'] as const,
};
