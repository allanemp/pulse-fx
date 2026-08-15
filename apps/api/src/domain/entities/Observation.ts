import { randomUUID } from 'node:crypto';
import { DomainError } from '../errors/DomainError.js';

export interface ObservationProps {
  id: string;
  indicatorId: string;
  date: Date;
  value: number;
  createdAt: Date;
}

/**
 * Entidade de domínio que representa o valor de um indicador observado em
 * uma data específica (um ponto de uma série temporal).
 *
 * Diferente de `ExchangeRate.rate`, `value` não é restrito a números
 * positivos: indicadores econômicos legitimamente assumem valores negativos
 * (ex.: variação do PIB).
 */
export class Observation {
  private constructor(private readonly props: ObservationProps) {}

  static create(input: { indicatorId: string; date: Date; value: number }): Observation {
    if (input.indicatorId.trim().length === 0) {
      throw new DomainError('indicatorId é obrigatório.');
    }

    if (!Number.isFinite(input.value)) {
      throw new DomainError('O valor da observação deve ser um número finito.');
    }

    Observation.assertNotInTheFuture(input.date);

    return new Observation({
      id: randomUUID(),
      indicatorId: input.indicatorId,
      date: input.date,
      value: input.value,
      createdAt: new Date(),
    });
  }

  /** Reidrata uma entidade a partir de dados já persistidos e validados. */
  static restore(props: ObservationProps): Observation {
    return new Observation(props);
  }

  private static assertNotInTheFuture(date: Date): void {
    const today = new Date();
    const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
    const observationUtc = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());

    if (observationUtc > todayUtc) {
      throw new DomainError('A data da observação não pode estar no futuro.');
    }
  }

  get id(): string {
    return this.props.id;
  }

  get indicatorId(): string {
    return this.props.indicatorId;
  }

  get date(): Date {
    return this.props.date;
  }

  get value(): number {
    return this.props.value;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }
}
