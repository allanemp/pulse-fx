import type { IndicatorDTO } from '@pulse-fx/shared';
import { useState } from 'react';
import { useIndicators } from '../hooks/useIndicators';
import { IndicatorCard } from './IndicatorCard';
import { IndicatorDetailModal } from './IndicatorDetailModal';

export function IndicatorsGrid() {
  const { data: indicators = [], isLoading, isError } = useIndicators();
  const [selectedIndicator, setSelectedIndicator] = useState<IndicatorDTO | null>(null);

  return (
    <section className="panel">
      <h2 className="mb-4 text-lg font-semibold text-slate-100">Indicadores</h2>

      {isLoading && <p className="text-sm text-slate-400">Carregando indicadores…</p>}
      {isError && <p className="error">Erro ao carregar indicadores.</p>}
      {!isLoading && !isError && indicators.length === 0 && (
        <p className="text-sm text-slate-400">Nenhum indicador cadastrado.</p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {indicators.map((indicator) => (
          <IndicatorCard
            key={indicator.id}
            indicator={indicator}
            onOpenDetails={setSelectedIndicator}
          />
        ))}
      </div>

      {selectedIndicator && (
        <IndicatorDetailModal
          indicator={selectedIndicator}
          onClose={() => setSelectedIndicator(null)}
        />
      )}
    </section>
  );
}
