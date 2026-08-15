import type { ObservationDTO } from '@pulse-fx/shared';
import { useState } from 'react';

interface ObservationsTableProps {
  observations: ObservationDTO[];
}

const PAGE_SIZE = 20;

const dateFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeZone: 'UTC' });

/**
 * Tabela do histórico completo, paginada (indicadores diários como o PTAX
 * chegam a ~3 mil observações — renderizar tudo de uma vez pesa a tela).
 * Mais recente primeiro; a página reseta sozinha porque o modal é remontado
 * a cada indicador aberto.
 */
export function ObservationsTable({ observations }: ObservationsTableProps) {
  const [page, setPage] = useState(1);

  if (observations.length === 0) {
    return <p className="text-sm text-slate-400">Nenhuma observação registrada.</p>;
  }

  const rows = [...observations].reverse();
  const pageCount = Math.ceil(rows.length / PAGE_SIZE);
  const currentPage = Math.min(page, pageCount);
  const pageRows = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div>
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-slate-800">
          <tr className="text-left text-slate-400">
            <th className="border-b border-slate-700 pb-2 pr-4 font-medium">Data</th>
            <th className="border-b border-slate-700 pb-2 font-medium">Valor</th>
          </tr>
        </thead>
        <tbody>
          {pageRows.map((observation) => (
            <tr key={observation.id} className="border-b border-slate-700/60 text-slate-200">
              <td className="py-2 pr-4">{dateFormatter.format(new Date(observation.date))}</td>
              <td className="py-2">
                {observation.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {pageCount > 1 && (
        <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={currentPage === 1}
            className="rounded-md border border-slate-700 px-2 py-1 transition hover:border-slate-500 hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ← Anterior
          </button>
          <span>
            Página {currentPage} de {pageCount}
          </span>
          <button
            type="button"
            onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
            disabled={currentPage === pageCount}
            className="rounded-md border border-slate-700 px-2 py-1 transition hover:border-slate-500 hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Próxima →
          </button>
        </div>
      )}
    </div>
  );
}
