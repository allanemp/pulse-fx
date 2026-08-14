import type { ExchangeRateDTO } from '@pulse-fx/shared';
import type { ExchangeRate } from '../../domain/entities/ExchangeRate.js';

/**
 * Converte a entidade de domínio para o formato trafegado pela API.
 *
 * Mantém `ExchangeRate` livre de conhecimento sobre serialização/JSON —
 * responsabilidade única de cada lado.
 */
export function toExchangeRateDTO(entity: ExchangeRate): ExchangeRateDTO {
  return {
    id: entity.id,
    baseCurrency: entity.pair.base,
    quoteCurrency: entity.pair.quote,
    rate: entity.rate,
    capturedAt: entity.capturedAt.toISOString(),
  };
}
