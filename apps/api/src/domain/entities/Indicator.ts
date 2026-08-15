import { randomUUID } from 'node:crypto';
import { DomainError } from '../errors/DomainError.js';

export interface IndicatorProps {
  id: string;
  name: string;
  createdAt: Date;
}

const MAX_NAME_LENGTH = 120;

/**
 * Entidade de domínio que representa um indicador cadastrado no catálogo
 * (ex.: SELIC, IPCA) — o "o quê" de uma série temporal de `Observation`.
 */
export class Indicator {
  private constructor(private readonly props: IndicatorProps) {}

  static create(input: { name: string }): Indicator {
    const name = input.name.trim();

    if (name.length === 0) {
      throw new DomainError('O nome do indicador não pode ser vazio.');
    }

    if (name.length > MAX_NAME_LENGTH) {
      throw new DomainError(
        `O nome do indicador deve ter no máximo ${MAX_NAME_LENGTH} caracteres.`,
      );
    }

    return new Indicator({ id: randomUUID(), name, createdAt: new Date() });
  }

  /** Reidrata uma entidade a partir de dados já persistidos e validados. */
  static restore(props: IndicatorProps): Indicator {
    return new Indicator(props);
  }

  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }
}
