import type { CreateExchangeRateInput, ExchangeRateDTO } from '@pulse-fx/shared';
import { httpClient } from './httpClient';

/**
 * Camada de acesso à API de cotações — isola os componentes React do
 * detalhe de quais rotas HTTP existem.
 */
export const exchangeRatesApi = {
  list: (): Promise<ExchangeRateDTO[]> => httpClient.get<ExchangeRateDTO[]>('/api/exchange-rates'),

  create: (input: CreateExchangeRateInput): Promise<ExchangeRateDTO> =>
    httpClient.post<ExchangeRateDTO>('/api/exchange-rates', input),
};
