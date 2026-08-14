import { ExchangeRateForm } from '../components/ExchangeRateForm';
import { ExchangeRateTable } from '../components/ExchangeRateTable';
import { useCreateExchangeRate } from '../hooks/useCreateExchangeRate';
import { useExchangeRates } from '../hooks/useExchangeRates';

export function DashboardPage() {
  const { data: exchangeRates = [], isLoading, isError, error } = useExchangeRates();
  const createExchangeRate = useCreateExchangeRate();

  return (
    <main className="dashboard">
      <header>
        <h1>Pulse FX</h1>
        <p>Monitoramento de cotações de câmbio</p>
      </header>

      <section className="panel">
        <h2>Registrar cotação</h2>
        <ExchangeRateForm
          onSubmit={async (input) => {
            await createExchangeRate.mutateAsync(input);
          }}
        />
      </section>

      <section className="panel">
        <h2>Cotações registradas</h2>
        {isLoading && <p>Carregando…</p>}
        {isError && (
          <p className="error">
            {error instanceof Error ? error.message : 'Erro ao carregar cotações.'}
          </p>
        )}
        {!isLoading && !isError && <ExchangeRateTable exchangeRates={exchangeRates} />}
      </section>
    </main>
  );
}
