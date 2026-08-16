import type { IndicatorDTO } from '@pulse-fx/shared';
import { useEffect, useMemo, useState } from 'react';
import { useObservations } from '../hooks/useObservations';
import type { HistoryPeriod } from '../utils/indicatorStats';
import { filterByPeriod, periodOptionsForFrequency } from '../utils/indicatorStats';
import { IndicatorHistoryChart } from './IndicatorHistoryChart';
import { ObservationsTable } from './ObservationsTable';

interface IndicatorDetailModalProps {
  indicator: IndicatorDTO;
  onClose: () => void;
}

/**
 * Visão aprofundada de um indicador: descrição/fonte/ressalvas, gráfico de
 * evolução (com mín./máx. do período) e a tabela histórica completa
 * paginada. Reaproveita a mesma query de `useObservations` já usada pelo
 * card (mesma query key) — abrir o modal não refaz o fetch.
 */
export function IndicatorDetailModal({ indicator, onClose }: IndicatorDetailModalProps) {
  const { data: observations, isLoading, isError } = useObservations(indicator.id);
  const periodOptions = periodOptionsForFrequency(indicator.frequency);
  const [period, setPeriod] = useState<HistoryPeriod>('12m');

  useEffect(() => {
    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const chartObservations = useMemo(
    () => (observations ? filterByPeriod(observations, period) : []),
    [observations, period],
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="indicator-detail-title"
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-xl border border-slate-700 bg-slate-800 shadow-xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-700 p-5">
          <div>
            <h2 id="indicator-detail-title" className="text-lg font-semibold text-slate-100">
              {indicator.name}
            </h2>
            {indicator.unit && <p className="text-xs text-slate-400">{indicator.unit}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-md p-1 text-slate-400 transition hover:bg-slate-700 hover:text-slate-100"
          >
            ✕
          </button>
        </header>

        {indicator.description && (
          <p className="border-b border-slate-700 p-5 text-sm text-slate-300">
            {indicator.description}
          </p>
        )}

        <div className="overflow-y-auto p-5">
          {isLoading && <p className="text-sm text-slate-400">Carregando histórico…</p>}
          {isError && <p className="text-sm text-red-400">Erro ao carregar o histórico.</p>}

          {observations && (
            <>
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-100">Evolução histórica</h3>
                  <div
                    role="group"
                    aria-label="Período do gráfico"
                    className="flex rounded-md border border-slate-700 p-0.5 text-xs"
                  >
                    {periodOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setPeriod(option.value)}
                        aria-pressed={period === option.value}
                        className={`rounded px-2 py-1 transition ${
                          period === option.value
                            ? 'bg-blue-500/20 text-blue-300'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <IndicatorHistoryChart observations={chartObservations} unit={indicator.unit} />
              </section>

              <section className="mt-6">
                <h3 className="mb-3 text-sm font-semibold text-slate-100">Histórico completo</h3>
                <ObservationsTable observations={observations} />
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
