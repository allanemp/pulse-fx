import { useCallback, useEffect, useState } from 'react';
import type { CreateExchangeRateInput, ExchangeRateDTO } from '@pulse-fx/shared';
import { exchangeRatesApi } from '../api/exchangeRatesApi';
import { ExchangeRateForm } from '../components/ExchangeRateForm';
import { ExchangeRateTable } from '../components/ExchangeRateTable';

export function DashboardPage() {
  const [exchangeRates, setExchangeRates] = useState<ExchangeRateDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadExchangeRates = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const data = await exchangeRatesApi.list();
      setExchangeRates(data);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Erro ao carregar cotações.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadExchangeRates();
  }, [loadExchangeRates]);

  async function handleCreate(input: CreateExchangeRateInput) {
    await exchangeRatesApi.create(input);
    await loadExchangeRates();
  }

  return (
    <main className="dashboard">
      <header>
        <h1>Pulse FX</h1>
        <p>Monitoramento de cotações de câmbio</p>
      </header>

      <section className="panel">
        <h2>Registrar cotação</h2>
        <ExchangeRateForm onSubmit={handleCreate} />
      </section>

      <section className="panel">
        <h2>Cotações registradas</h2>
        {isLoading && <p>Carregando…</p>}
        {loadError && <p className="error">{loadError}</p>}
        {!isLoading && !loadError && <ExchangeRateTable exchangeRates={exchangeRates} />}
      </section>
    </main>
  );
}
