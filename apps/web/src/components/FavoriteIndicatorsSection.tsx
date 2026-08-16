import { useIndicators } from '../hooks/useIndicators';
import { IndicatorCardSkeleton } from './IndicatorCardSkeleton';
import { IndicatorCardsGrid } from './IndicatorCardsGrid';

const SKELETON_COUNT = 2;

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

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
            <IndicatorCardSkeleton key={index} />
          ))}
        </div>
      )}
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
