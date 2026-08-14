import { DomainError } from '../errors/DomainError.js';

const CURRENCY_CODE_PATTERN = /^[A-Z]{3}$/;

/**
 * Value Object que representa um par de moedas (ex.: USD/BRL).
 *
 * Imutável e auto-validado: não existe instância de `CurrencyPair` em
 * estado inválido, o que elimina checagens defensivas repetidas nas
 * camadas superiores.
 */
export class CurrencyPair {
  private constructor(
    public readonly base: string,
    public readonly quote: string,
  ) {}

  static create(base: string, quote: string): CurrencyPair {
    const normalizedBase = base.trim().toUpperCase();
    const normalizedQuote = quote.trim().toUpperCase();

    if (!CURRENCY_CODE_PATTERN.test(normalizedBase)) {
      throw new DomainError(
        `Código de moeda base inválido: "${base}". Use o padrão ISO 4217 (ex.: USD).`,
      );
    }

    if (!CURRENCY_CODE_PATTERN.test(normalizedQuote)) {
      throw new DomainError(
        `Código de moeda de cotação inválido: "${quote}". Use o padrão ISO 4217 (ex.: BRL).`,
      );
    }

    if (normalizedBase === normalizedQuote) {
      throw new DomainError('A moeda base e a moeda de cotação não podem ser iguais.');
    }

    return new CurrencyPair(normalizedBase, normalizedQuote);
  }

  toString(): string {
    return `${this.base}/${this.quote}`;
  }

  equals(other: CurrencyPair): boolean {
    return this.base === other.base && this.quote === other.quote;
  }
}
