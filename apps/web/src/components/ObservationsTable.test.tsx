// @vitest-environment jsdom
import type { ObservationDTO } from '@pulse-fx/shared';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ObservationsTable } from './ObservationsTable';

function buildObservations(count: number): ObservationDTO[] {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(Date.UTC(2026, 0, 1 + index));
    return {
      id: `obs-${index}`,
      indicatorId: 'indicator-1',
      date: date.toISOString().slice(0, 10),
      value: index,
      createdAt: date.toISOString(),
    };
  });
}

describe('ObservationsTable', () => {
  it('mostra mensagem de vazio quando não há observações', () => {
    render(<ObservationsTable observations={[]} />);

    expect(screen.getByText('Nenhuma observação registrada.')).toBeInTheDocument();
  });

  it('mostra todas as linhas sem controle de paginação quando cabem numa página', () => {
    render(<ObservationsTable observations={buildObservations(5)} />);

    expect(screen.getAllByRole('row')).toHaveLength(6); // 5 linhas + cabeçalho
    expect(screen.queryByText(/Página \d+ de \d+/)).not.toBeInTheDocument();
  });

  it('mostra a observação mais recente primeiro', () => {
    render(<ObservationsTable observations={buildObservations(3)} />);

    const dataCells = screen.getAllByRole('row').slice(1).map((row) => row.textContent);
    // A última gerada (index 2) tem a data mais recente — deve vir na primeira linha.
    expect(dataCells[0]).toContain('03/01/2026');
    expect(dataCells[2]).toContain('01/01/2026');
  });

  it('pagina em blocos de 20, com "Anterior" desabilitado na primeira página', () => {
    render(<ObservationsTable observations={buildObservations(45)} />);

    expect(screen.getByText('Página 1 de 3')).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(21); // 20 linhas + cabeçalho
    expect(screen.getByRole('button', { name: '← Anterior' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Próxima →' })).toBeEnabled();
  });

  it('avança de página ao clicar em "Próxima" e desabilita na última página', async () => {
    const user = userEvent.setup();
    render(<ObservationsTable observations={buildObservations(45)} />);

    await user.click(screen.getByRole('button', { name: 'Próxima →' }));
    expect(screen.getByText('Página 2 de 3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '← Anterior' })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: 'Próxima →' }));
    expect(screen.getByText('Página 3 de 3')).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(6); // resto: 45 - 40 = 5 linhas + cabeçalho
    expect(screen.getByRole('button', { name: 'Próxima →' })).toBeDisabled();
  });
});
