/**
 * Banner de topo, full-bleed e fixo (sticky) — identidade do app + selo de
 * confiança na fonte dos dados sempre visível, mesmo rolando a página.
 */
export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-900/95 backdrop-blur supports-[backdrop-filter]:bg-slate-900/80">
      <div className="mx-auto flex max-w-5xl flex-col items-start gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 text-blue-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path d="M3 12h4l2-7 4 14 2-7h6" />
            </svg>
          </span>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-50 sm:text-2xl">
              Pulse FX
            </h1>
            <p className="mt-0.5 text-sm text-slate-400">
              Monitoramento de indicadores econômicos em tempo real
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-xs text-slate-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
          Dados de fontes oficiais (bancos centrais)
        </div>
      </div>
    </header>
  );
}
