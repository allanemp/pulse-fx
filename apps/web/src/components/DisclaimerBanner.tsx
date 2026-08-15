/** Aviso legal fixo no rodapé — visível em toda a aplicação. */
export function DisclaimerBanner() {
  return (
    <footer className="border-t border-amber-500/20 bg-amber-500/5 px-4 py-3 text-center text-xs text-amber-200/80">
      Os dados exibidos têm fins meramente educacionais e informativos, não constituem recomendação
      de investimento e podem estar desatualizados. Consulte sempre as fontes oficiais (ex.: Banco
      Central do Brasil) antes de qualquer decisão financeira.
    </footer>
  );
}
