import { useIndicators } from '../hooks/useIndicators';
import { IndicatorCardsGrid } from './IndicatorCardsGrid';

export function IndicatorsGrid() {
  const { data: indicators = [], isLoading, isError } = useIndicators();

  return (
    <section className="panel">
      <h2 className="mb-4 text-lg font-semibold text-slate-100">Indicadores</h2>

      {isLoading && <p className="text-sm text-slate-400">Carregando indicadores…</p>}
      {isError && <p className="error">Erro ao carregar indicadores.</p>}
      {!isLoading && !isError && (
        <IndicatorCardsGrid indicators={indicators} emptyMessage="Nenhum indicador cadastrado." />
      )}
    </section>
  );
}
