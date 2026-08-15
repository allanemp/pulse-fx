import type { ObservationDTO } from '@pulse-fx/shared';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { TooltipContentProps } from 'recharts';
import { computeMinMax } from '../utils/indicatorStats';

interface IndicatorHistoryChartProps {
  observations: ObservationDTO[];
  unit?: string | undefined;
}

const SERIES_COLOR = '#3b82f6';
const SURFACE_COLOR = '#1e293b';
const GRID_COLOR = '#334155';
const MUTED_TEXT_COLOR = '#94a3b8';

const axisDateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  timeZone: 'UTC',
});
const tooltipDateFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'long',
  timeZone: 'UTC',
});

function formatValue(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function ChartTooltip({ active, payload }: TooltipContentProps) {
  const point = payload?.[0]?.payload as ObservationDTO | undefined;

  if (!active || !point) {
    return null;
  }

  return (
    <div className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs shadow-lg">
      <p className="text-slate-400">{tooltipDateFormatter.format(new Date(point.date))}</p>
      <p className="font-semibold text-slate-100">{formatValue(point.value)}</p>
    </div>
  );
}

/**
 * Gráfico de linha da evolução histórica de um indicador (recharts). Série
 * única: sem legenda (o título da seção já identifica a série) — a cor segue
 * o mesmo azul de destaque usado no resto da UI. Mín. e máx. do período
 * marcados como pontos de referência neutros (não usam verde/vermelho, que
 * no app já tem outro significado: alta/baixa da variação no card).
 */
export function IndicatorHistoryChart({ observations, unit }: IndicatorHistoryChartProps) {
  if (observations.length < 2) {
    return (
      <p className="text-sm text-slate-400">
        Dados insuficientes no período selecionado para exibir o gráfico.
      </p>
    );
  }

  const minMax = computeMinMax(observations);
  const values = observations.map((observation) => observation.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = (max - min) * 0.1 || Math.abs(max) * 0.05 || 1;

  return (
    <div>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={observations} margin={{ top: 12, right: 12, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="indicatorHistoryFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={SERIES_COLOR} stopOpacity={0.18} />
              <stop offset="100%" stopColor={SERIES_COLOR} stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid stroke={GRID_COLOR} strokeWidth={1} vertical={false} />

          <XAxis
            dataKey="date"
            tickFormatter={(value: string) => axisDateFormatter.format(new Date(value))}
            tick={{ fill: MUTED_TEXT_COLOR, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            minTickGap={40}
          />

          <YAxis
            domain={[min - padding, max + padding]}
            tickFormatter={(value: number) =>
              value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })
            }
            tick={{ fill: MUTED_TEXT_COLOR, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={56}
          />

          <Tooltip content={ChartTooltip} cursor={{ stroke: GRID_COLOR, strokeWidth: 1 }} />

          <Area
            type="monotone"
            dataKey="value"
            stroke={SERIES_COLOR}
            strokeWidth={2}
            strokeLinecap="round"
            fill="url(#indicatorHistoryFill)"
            dot={false}
            activeDot={{ r: 5, fill: SERIES_COLOR, stroke: SURFACE_COLOR, strokeWidth: 2 }}
            isAnimationActive={false}
          />

          {minMax && (
            <>
              <ReferenceDot
                x={minMax.min.date}
                y={minMax.min.value}
                r={4}
                fill="#cbd5e1"
                stroke={SURFACE_COLOR}
                strokeWidth={2}
              />
              <ReferenceDot
                x={minMax.max.date}
                y={minMax.max.value}
                r={4}
                fill="#cbd5e1"
                stroke={SURFACE_COLOR}
                strokeWidth={2}
              />
            </>
          )}
        </AreaChart>
      </ResponsiveContainer>

      {minMax && (
        <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2">
            <p className="text-slate-400">Mínimo no período</p>
            <p className="font-semibold text-slate-100">
              {formatValue(minMax.min.value)} {unit}
            </p>
            <p className="text-slate-500">
              {tooltipDateFormatter.format(new Date(minMax.min.date))}
            </p>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2">
            <p className="text-slate-400">Máximo no período</p>
            <p className="font-semibold text-slate-100">
              {formatValue(minMax.max.value)} {unit}
            </p>
            <p className="text-slate-500">
              {tooltipDateFormatter.format(new Date(minMax.max.date))}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
