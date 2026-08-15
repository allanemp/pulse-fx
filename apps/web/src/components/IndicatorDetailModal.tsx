import type { IndicatorDTO } from '@pulse-fx/shared';
import { useEffect } from 'react';
import { useObservations } from '../hooks/useObservations';
import { ObservationsTable } from './ObservationsTable';

interface IndicatorDetailModalProps {
  indicator: IndicatorDTO;
  onClose: () => void;
}

/**
 * Visão aprofundada de um indicador: descrição/fonte/ressalvas e a tabela
 * histórica completa. Reaproveita a mesma query de `useObservations` já
 * usada pelo card (mesma query key) — abrir o modal não refaz o fetch.
 */
export function IndicatorDetailModal({ indicator, onClose }: IndicatorDetailModalProps) {
  const { data: observations, isLoading, isError } = useObservations(indicator.id);

  useEffect(() => {
    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

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
          {observations && <ObservationsTable observations={observations} />}
        </div>
      </div>
    </div>
  );
}
