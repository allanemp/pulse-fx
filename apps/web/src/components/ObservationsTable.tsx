import type { ObservationDTO } from '@pulse-fx/shared';

interface ObservationsTableProps {
  observations: ObservationDTO[];
}

const dateFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeZone: 'UTC' });

/** Histórico completo, mais recente primeiro (a API devolve em ordem crescente). */
export function ObservationsTable({ observations }: ObservationsTableProps) {
  if (observations.length === 0) {
    return <p className="text-sm text-slate-400">Nenhuma observação registrada.</p>;
  }

  const rows = [...observations].reverse();

  return (
    <table className="w-full text-sm">
      <thead className="sticky top-0 bg-slate-800">
        <tr className="text-left text-slate-400">
          <th className="border-b border-slate-700 pb-2 pr-4 font-medium">Data</th>
          <th className="border-b border-slate-700 pb-2 font-medium">Valor</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((observation) => (
          <tr key={observation.id} className="border-b border-slate-700/60 text-slate-200">
            <td className="py-2 pr-4">{dateFormatter.format(new Date(observation.date))}</td>
            <td className="py-2">
              {observation.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
