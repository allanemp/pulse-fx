import { useState, type FormEvent } from 'react';
import type { CreateExchangeRateInput } from '@pulse-fx/shared';

interface ExchangeRateFormProps {
  onSubmit: (input: CreateExchangeRateInput) => Promise<void>;
}

const initialState = { baseCurrency: '', quoteCurrency: '', rate: '' };

export function ExchangeRateForm({ onSubmit }: ExchangeRateFormProps) {
  const [form, setForm] = useState(initialState);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await onSubmit({
        baseCurrency: form.baseCurrency,
        quoteCurrency: form.quoteCurrency,
        rate: Number(form.rate),
      });
      setForm(initialState);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao registrar cotação.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="exchange-rate-form" onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="baseCurrency">Moeda base</label>
        <input
          id="baseCurrency"
          maxLength={3}
          placeholder="USD"
          value={form.baseCurrency}
          onChange={(e) => setForm({ ...form, baseCurrency: e.target.value.toUpperCase() })}
          required
        />
      </div>

      <div className="field">
        <label htmlFor="quoteCurrency">Moeda de cotação</label>
        <input
          id="quoteCurrency"
          maxLength={3}
          placeholder="BRL"
          value={form.quoteCurrency}
          onChange={(e) => setForm({ ...form, quoteCurrency: e.target.value.toUpperCase() })}
          required
        />
      </div>

      <div className="field">
        <label htmlFor="rate">Cotação</label>
        <input
          id="rate"
          type="number"
          step="0.0001"
          min="0"
          placeholder="5.4200"
          value={form.rate}
          onChange={(e) => setForm({ ...form, rate: e.target.value })}
          required
        />
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Registrando…' : 'Registrar cotação'}
      </button>

      {error && <p className="error">{error}</p>}
    </form>
  );
}
