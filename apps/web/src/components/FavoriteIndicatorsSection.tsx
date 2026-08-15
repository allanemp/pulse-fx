import { useIndicators } from '../hooks/useIndicators';
import { IndicatorCardsGrid } from './IndicatorCardsGrid';

/**
 * "Meus Indicadores Favoritos" — reaproveita a mesma query de
 * `useIndicators` já usada pela grade completa (mesmo cache do TanStack
 * Query, sem fetch extra) e só filtra pelos marcados como favorito.
 */
export function FavoriteIndicatorsSection() {
  const { data: indicators = [], isLoading, isError } = useIndicators();
  const favoriteIndicators = indicators.filter((indicator) => indicator.isFavorite);

  return (
    <section className="panel">
      <h2 className="mb-4 text-lg font-semibold text-slate-100">Meus Indicadores Favoritos</h2>

      {isLoading && <p className="text-sm text-slate-400">Carregando…</p>}
      {isError && <p className="error">Erro ao carregar indicadores.</p>}
      {!isLoading && !isError && (
        <IndicatorCardsGrid
          indicators={favoriteIndicators}
          emptyMessage="Você ainda não tem indicadores favoritos — clique na estrela ☆ de um card para adicionar."
        />
      )}
    </section>
  );
}
