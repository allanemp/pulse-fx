import type { ExchangeRateDTO } from '@pulse-fx/shared';
import { DomainError } from '../../domain/errors/DomainError.js';
import type { ExchangeRateRepository } from '../../domain/repositories/ExchangeRateRepository.js';
import { CurrencyPair } from '../../domain/value-objects/CurrencyPair.js';
import { toExchangeRateDTO } from '../dtos/ExchangeRateMapper.js';

export interface GetLatestExchangeRateInput {
  baseCurrency: string;
  quoteCurrency: string;
}

/**
 * Caso de uso: obter a cotação mais recente para um par de moedas.
 */
export class GetLatestExchangeRate {
  constructor(private readonly exchangeRateRepository: ExchangeRateRepository) {}

  async execute(input: GetLatestExchangeRateInput): Promise<ExchangeRateDTO> {
    const pair = CurrencyPair.create(input.baseCurrency, input.quoteCurrency);

    const exchangeRate = await this.exchangeRateRepository.findLatestByPair(pair);

    if (!exchangeRate) {
      throw new DomainError(`Nenhuma cotação encontrada para o par ${pair.toString()}.`);
    }

    return toExchangeRateDTO(exchangeRate);
  }
}
