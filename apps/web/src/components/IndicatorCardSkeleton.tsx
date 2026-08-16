import { Skeleton } from './Skeleton';

/**
 * Placeholder no mesmo formato de `IndicatorCard` — usado enquanto a lista
 * de indicadores ainda está carregando, pra grade não "pular" de tamanho
 * quando os cards de verdade chegam.
 */
export function IndicatorCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-700 bg-slate-800 p-5">
      <div className="pr-8">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="mt-2 h-3 w-1/4" />
      </div>

      <div className="flex items-end justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
    </div>
  );
}
