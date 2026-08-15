import type { IndicatorDTO } from '@pulse-fx/shared';
import { useState } from 'react';
import { IndicatorCard } from './IndicatorCard';
import { IndicatorDetailModal } from './IndicatorDetailModal';

interface IndicatorCardsGridProps {
  indicators: IndicatorDTO[];
  emptyMessage: string;
}

/**
 * Grade de cards + modal de detalhes — extraído de `IndicatorsGrid` para
 * ser reaproveitado por qualquer seção que só precise mostrar uma lista de
 * indicadores (ex.: todos, ou só os favoritos), sem duplicar a lógica de
 * "qual card está aberto no modal".
 */
export function IndicatorCardsGrid({ indicators, emptyMessage }: IndicatorCardsGridProps) {
  const [selectedIndicator, setSelectedIndicator] = useState<IndicatorDTO | null>(null);

  if (indicators.length === 0) {
    return <p className="text-sm text-slate-400">{emptyMessage}</p>;
  }

  return (
    <>
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
    </>
  );
}
