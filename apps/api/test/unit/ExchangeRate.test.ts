import { describe, expect, it } from 'vitest';
import { ExchangeRate } from '../../src/domain/entities/ExchangeRate.js';
import { DomainError } from '../../src/domain/errors/DomainError.js';

describe('ExchangeRate (entidade de domínio)', () => {
  it('cria uma cotação válida normalizando os códigos de moeda', () => {
    const exchangeRate = ExchangeRate.create({
      baseCurrency: 'usd',
      quoteCurrency: 'brl',
      rate: 5.42,
    });

    expect(exchangeRate.pair.base).toBe('USD');
    expect(exchangeRate.pair.quote).toBe('BRL');
    expect(exchangeRate.rate).toBe(5.42);
  });

  it('rejeita cotação com valor menor ou igual a zero', () => {
    expect(() =>
      ExchangeRate.create({ baseCurrency: 'USD', quoteCurrency: 'BRL', rate: 0 }),
    ).toThrow(DomainError);
  });

  it('rejeita par de moedas iguais', () => {
    expect(() =>
      ExchangeRate.create({ baseCurrency: 'USD', quoteCurrency: 'USD', rate: 1 }),
    ).toThrow(DomainError);
  });

  it('rejeita data de captura no futuro', () => {
    const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);

    expect(() =>
      ExchangeRate.create({
        baseCurrency: 'USD',
        quoteCurrency: 'BRL',
        rate: 5.42,
        capturedAt: oneHourFromNow,
      }),
    ).toThrow(DomainError);
  });
});
