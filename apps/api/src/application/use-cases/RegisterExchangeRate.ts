import type { ExchangeRateDTO } from '@pulse-fx/shared';
import { ExchangeRate } from '../../domain/entities/ExchangeRate.js';
import type { ExchangeRateRepository } from '../../domain/repositories/ExchangeRateRepository.js';
import { toExchangeRateDTO } from '../dtos/ExchangeRateMapper.js';

export interface RegisterExchangeRateInput {
  baseCurrency: string;
  quoteCurrency: string;
  rate: number;
  capturedAt?: Date | undefined;
}

/**
 * Caso de uso: registrar uma nova cotação de câmbio.
 *
 * Depende apenas da abstração `ExchangeRateRepository` (injetada no
 * construtor), o que o torna testável sem banco de dados e independente do
 * mecanismo de persistência escolhido.
 */
export class RegisterExchangeRate {
  constructor(private readonly exchangeRateRepository: ExchangeRateRepository) {}

  async execute(input: RegisterExchangeRateInput): Promise<ExchangeRateDTO> {
    const exchangeRate = ExchangeRate.create(input);

    await this.exchangeRateRepository.save(exchangeRate);

    return toExchangeRateDTO(exchangeRate);
  }
}
