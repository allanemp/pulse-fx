import type { IndicatorDTO } from '@pulse-fx/shared';
import type { KeyboardEvent, MouseEvent } from 'react';
import { useObservations } from '../hooks/useObservations';
import { useToggleFavorite } from '../hooks/useToggleFavorite';
import { computeLatestChange } from '../utils/indicatorChange';
import { IndicatorLatestValue } from './IndicatorLatestValue';
import { Skeleton } from './Skeleton';

interface IndicatorCardProps {
  indicator: IndicatorDTO;
  onOpenDetails: (indicator: IndicatorDTO) => void;
}

/**
 * Card de um indicador no dashboard — nome/unidade, valor mais recente,
 * data e variação percentual vs. a observação anterior (verde/vermelho),
 * mais o botão de favoritar. O card inteiro é clicável (abre o modal de
 * detalhes); o botão de favoritar cancela a propagação do clique para não
 * abrir o modal junto.
 */
export function IndicatorCard({ indicator, onOpenDetails }: IndicatorCardProps) {
  const { data: observations, isLoading, isError } = useObservations(indicator.id);
  const toggleFavorite = useToggleFavorite();

  const change = observations ? computeLatestChange(observations) : null;

  function handleToggleFavorite(event: MouseEvent) {
    event.stopPropagation();
    toggleFavorite.mutate({ indicatorId: indicator.id, isFavorite: indicator.isFavorite });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onOpenDetails(indicator);
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpenDetails(indicator)}
      onKeyDown={handleKeyDown}
      className="group relative flex cursor-pointer flex-col gap-3 rounded-xl border border-slate-700 bg-slate-800 p-5 text-left transition hover:border-slate-600 hover:bg-slate-800/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      <button
        type="button"
        onClick={handleToggleFavorite}
        disabled={toggleFavorite.isPending}
        aria-label={indicator.isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
        aria-pressed={indicator.isFavorite}
        className="absolute right-4 top-4 text-xl leading-none text-slate-500 transition hover:text-amber-400 disabled:opacity-50"
      >
        {indicator.isFavorite ? '★' : '☆'}
      </button>

      <div className="pr-8">
        <h3 className="font-semibold text-slate-100">{indicator.name}</h3>
        {indicator.unit && <p className="text-xs text-slate-400">{indicator.unit}</p>}
      </div>

      {isLoading && (
        <div className="flex items-end justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      )}
      {isError && <p className="text-sm text-red-400">Erro ao carregar dados.</p>}

      {change && <IndicatorLatestValue change={change} />}
    </div>
  );
}
