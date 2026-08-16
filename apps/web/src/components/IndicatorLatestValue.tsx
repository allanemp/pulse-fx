import type { IndicatorChange } from '../utils/indicatorChange';

interface IndicatorLatestValueProps {
  change: IndicatorChange;
}

const dateFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeZone: 'UTC' });

function formatValue(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Valor mais recente + data de referência + variação % vs. a observação
 * anterior. Um só componente usado tanto no card do dashboard quanto no
 * modal de detalhamento — "a mesma regra nos dois lugares" fica garantida
 * por serem literalmente o mesmo componente, não duas implementações que
 * podem divergir com o tempo.
 */
export function IndicatorLatestValue({ change }: IndicatorLatestValueProps) {
  return (
    <div className="flex items-end justify-between">
      <div>
        <p className="text-2xl font-bold text-slate-50">{formatValue(change.latest.value)}</p>
        <p className="text-xs text-slate-400">
          {dateFormatter.format(new Date(change.latest.date))}
        </p>
      </div>

      {change.changePercent !== null && (
        <span
          className={`rounded-full px-2 py-1 text-xs font-medium ${
            change.changePercent > 0
              ? 'bg-emerald-500/10 text-emerald-400'
              : change.changePercent < 0
                ? 'bg-red-500/10 text-red-400'
                : 'bg-slate-700 text-slate-300'
          }`}
        >
          {change.changePercent > 0 ? '▲' : change.changePercent < 0 ? '▼' : '—'}{' '}
          {formatValue(Math.abs(change.changePercent))}%
        </span>
      )}
    </div>
  );
}
