/** Rodapé — identidade + o que é monitorado, aviso legal em destaque e crédito da fonte dos dados. */
export function DisclaimerBanner() {
  return (
    <footer className="border-t border-slate-800 bg-slate-900">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-200">Pulse FX</p>
            <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-500">
              Dashboard de monitoramento de indicadores econômicos, com sincronização diária
              direto de fontes oficiais (bancos centrais).
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Indicadores monitorados
            </p>
            <ul className="mt-2 space-y-1 text-xs text-slate-500">
              <li>Selic acumulada no mês</li>
              <li>IPCA (variação mensal)</li>
              <li>Dólar comercial (PTAX venda)</li>
            </ul>
          </div>
        </div>

        <p className="mt-6 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-center text-xs leading-relaxed text-amber-200/80">
          Os dados exibidos têm fins meramente educacionais e informativos, não constituem
          recomendação de investimento e podem estar desatualizados. Consulte sempre as fontes
          oficiais (ex.: Banco Central do Brasil) antes de qualquer decisão financeira.
        </p>

        <p className="mt-4 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Pulse FX — dados de fontes oficiais (bancos centrais)
        </p>
      </div>
    </footer>
  );
}
