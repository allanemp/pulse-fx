interface SkeletonProps {
  className?: string;
}

/** Bloco retangular com pulsação — peça básica dos placeholders de carregamento. */
export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`animate-pulse rounded bg-slate-700/50 ${className}`} aria-hidden="true" />;
}
