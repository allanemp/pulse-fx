import type { IndicatorDTO, ObservationDTO } from '@pulse-fx/shared';
import { httpClient } from './httpClient';

/**
 * Camada de acesso à API de indicadores — isola os componentes React do
 * detalhe de quais rotas HTTP existem.
 */
export const indicatorsApi = {
  list: (): Promise<IndicatorDTO[]> => httpClient.get<IndicatorDTO[]>('/api/indicators'),

  latestObservation: (indicatorId: string): Promise<ObservationDTO> =>
    httpClient.get<ObservationDTO>(`/api/indicators/${indicatorId}/observations/latest`),

  observations: (indicatorId: string): Promise<ObservationDTO[]> =>
    httpClient.get<ObservationDTO[]>(`/api/indicators/${indicatorId}/observations`),

  markFavorite: (indicatorId: string): Promise<void> =>
    httpClient.put<void>(`/api/indicators/${indicatorId}/favorite`),

  unmarkFavorite: (indicatorId: string): Promise<void> =>
    httpClient.delete<void>(`/api/indicators/${indicatorId}/favorite`),
};
