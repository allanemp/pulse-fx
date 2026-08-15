/**
 * Fábrica de query keys — mantém as chaves usadas por
 * `useQuery`/`useMutation`/invalidação em um único lugar, evitando strings
 * mágicas espalhadas pelos hooks.
 */
export const indicatorKeys = {
  all: ['indicators'] as const,
  lists: () => [...indicatorKeys.all, 'list'] as const,
};

export const observationKeys = {
  all: ['observations'] as const,
  list: (indicatorId: string) => [...observationKeys.all, 'list', indicatorId] as const,
};
