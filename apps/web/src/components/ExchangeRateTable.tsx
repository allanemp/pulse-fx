import type { ExchangeRateDTO } from '@pulse-fx/shared';

interface ExchangeRateTableProps {
  exchangeRates: ExchangeRateDTO[];
}

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'medium',
});

export function ExchangeRateTable({ exchangeRates }: ExchangeRateTableProps) {
  if (exchangeRates.length === 0) {
    return <p className="empty-state">Nenhuma cotação registrada ainda.</p>;
  }

  return (
    <table className="exchange-rate-table">
      <thead>
        <tr>
          <th>Par</th>
          <th>Cotação</th>
          <th>Capturada em</th>
        </tr>
      </thead>
      <tbody>
        {exchangeRates.map((exchangeRate) => (
          <tr key={exchangeRate.id}>
            <td>
              {exchangeRate.baseCurrency}/{exchangeRate.quoteCurrency}
            </td>
            <td>{exchangeRate.rate.toLocaleString('pt-BR', { minimumFractionDigits: 4 })}</td>
            <td>{dateFormatter.format(new Date(exchangeRate.capturedAt))}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
