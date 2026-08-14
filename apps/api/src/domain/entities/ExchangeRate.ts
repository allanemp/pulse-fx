import { randomUUID } from 'node:crypto';
import { DomainError } from '../errors/DomainError.js';
import { CurrencyPair } from '../value-objects/CurrencyPair.js';

export interface ExchangeRateProps {
  id: string;
  pair: CurrencyPair;
  rate: number;
  capturedAt: Date;
  createdAt: Date;
}

const MAX_FUTURE_TOLERANCE_MS = 60_000;

/**
 * Entidade de domínio que representa a cotação de um par de moedas em um
 * determinado instante.
 *
 * Toda regra que garante a consistência de uma cotação vive aqui, e não em
 * controllers ou repositórios — assim ela vale para qualquer forma de
 * entrada (HTTP hoje, uma fila ou um job amanhã).
 */
export class ExchangeRate {
  private constructor(private readonly props: ExchangeRateProps) {}

  /** Cria uma nova cotação, validando as regras de negócio. */
  static create(input: {
    baseCurrency: string;
    quoteCurrency: string;
    rate: number;
    capturedAt?: Date | undefined;
  }): ExchangeRate {
    const pair = CurrencyPair.create(input.baseCurrency, input.quoteCurrency);
    const capturedAt = input.capturedAt ?? new Date();

    ExchangeRate.assertRateIsPositive(input.rate);
    ExchangeRate.assertNotCapturedInTheFuture(capturedAt);

    return new ExchangeRate({
      id: randomUUID(),
      pair,
      rate: input.rate,
      capturedAt,
      createdAt: new Date(),
    });
  }

  /** Reidrata uma entidade a partir de dados já persistidos e validados. */
  static restore(props: ExchangeRateProps): ExchangeRate {
    return new ExchangeRate(props);
  }

  private static assertRateIsPositive(rate: number): void {
    if (!Number.isFinite(rate) || rate <= 0) {
      throw new DomainError('A cotação (rate) deve ser um número finito maior que zero.');
    }
  }

  private static assertNotCapturedInTheFuture(capturedAt: Date): void {
    if (capturedAt.getTime() - Date.now() > MAX_FUTURE_TOLERANCE_MS) {
      throw new DomainError('A data de captura (capturedAt) não pode estar no futuro.');
    }
  }

  get id(): string {
    return this.props.id;
  }

  get pair(): CurrencyPair {
    return this.props.pair;
  }

  get rate(): number {
    return this.props.rate;
  }

  get capturedAt(): Date {
    return this.props.capturedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }
}
