import type { ExchangeRateDTO } from '@pulse-fx/shared';
import type { ExchangeRateRepository } from '../../domain/repositories/ExchangeRateRepository.js';
import { CurrencyPair } from '../../domain/value-objects/CurrencyPair.js';
import { toExchangeRateDTO } from '../dtos/ExchangeRateMapper.js';

export interface ListExchangeRatesInput {
  baseCurrency?: string | undefined;
  quoteCurrency?: string | undefined;
}

/**
 * Caso de uso: listar cotações registradas, com filtro opcional por par de
 * moedas.
 */
export class ListExchangeRates {
  constructor(private readonly exchangeRateRepository: ExchangeRateRepository) {}

  async execute(input: ListExchangeRatesInput = {}): Promise<ExchangeRateDTO[]> {
    const pair =
      input.baseCurrency && input.quoteCurrency
        ? CurrencyPair.create(input.baseCurrency, input.quoteCurrency)
        : undefined;

    const exchangeRates = await this.exchangeRateRepository.findMany(pair ? { pair } : undefined);

    return exchangeRates
      .sort((a, b) => b.capturedAt.getTime() - a.capturedAt.getTime())
      .map(toExchangeRateDTO);
  }
}
