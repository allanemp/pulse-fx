/**
 * Contratos compartilhados entre `apps/api` e `apps/web`.
 *
 * Mantém o formato dos dados trafegados pela API como única fonte de verdade,
 * evitando divergência entre o tipo usado no backend e o consumido no frontend.
 */

export interface ExchangeRateDTO {
  id: string;
  baseCurrency: string;
  quoteCurrency: string;
  rate: number;
  capturedAt: string;
}

export interface CreateExchangeRateInput {
  baseCurrency: string;
  quoteCurrency: string;
  rate: number;
  capturedAt?: string;
}

export interface ApiErrorResponse {
  message: string;
  details?: Record<string, string[]>;
}

export interface IndicatorDTO {
  id: string;
  name: string;
  unit?: string;
  description?: string;
  sourceEndpoint?: string;
  isFavorite: boolean;
  createdAt: string;
}

export interface CreateIndicatorInput {
  name: string;
  unit?: string;
  description?: string;
  sourceEndpoint?: string;
}

export interface ObservationDTO {
  id: string;
  indicatorId: string;
  date: string;
  value: number;
  createdAt: string;
}

export interface CreateObservationInput {
  date: string;
  value: number;
}
