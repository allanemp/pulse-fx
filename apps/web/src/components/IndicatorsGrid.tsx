import { useIndicators } from '../hooks/useIndicators';
import { IndicatorCardSkeleton } from './IndicatorCardSkeleton';
import { IndicatorCardsGrid } from './IndicatorCardsGrid';

const SKELETON_COUNT = 3;

export function IndicatorsGrid() {
  const { data: indicators = [], isLoading, isError } = useIndicators();

  return (
    <section className="panel">
      <h2 className="mb-4 text-lg font-semibold text-slate-100">Indicadores</h2>

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
            <IndicatorCardSkeleton key={index} />
          ))}
        </div>
      )}
      {isError && <p className="error">Erro ao carregar indicadores.</p>}
      {!isLoading && !isError && (
        <IndicatorCardsGrid indicators={indicators} emptyMessage="Nenhum indicador cadastrado." />
      )}
    </section>
  );
}
