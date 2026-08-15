import type {
  IndicatorDataPoint,
  IndicatorDataSource,
} from '../../domain/gateways/IndicatorDataSource.js';
import { env } from '../config/env.js';

/** Formato retornado pela API do SGS/BCB: `{"data":"DD/MM/YYYY","valor":"1.16"}`. */
interface BcbSeriesEntry {
  data: string;
  valor: string;
}

function parseBcbDate(value: string): Date {
  const [dayStr, monthStr, yearStr] = value.split('/');

  if (!dayStr || !monthStr || !yearStr) {
    throw new Error(`Data em formato inesperado: "${value}" (esperado DD/MM/YYYY).`);
  }

  return new Date(Date.UTC(Number(yearStr), Number(monthStr) - 1, Number(dayStr)));
}

/**
 * Busca séries no SGS do Banco Central. `sourceEndpoint` é o complemento
 * salvo por indicador (ex.: `/dados/serie/bcdata.sgs.4390/dados?formato=json`);
 * o domínio (`BCB_API_BASE_URL`) é o mesmo para qualquer indicador dessa fonte.
 *
 * Único lugar do projeto que conhece o formato de resposta do SGS — usado
 * tanto pelo seed (bootstrap manual) quanto pelo worker da fila (sincronização
 * diária), para não duplicar o parsing entre os dois.
 */
export class BcbIndicatorDataSource implements IndicatorDataSource {
  async fetchSeries(sourceEndpoint: string): Promise<IndicatorDataPoint[]> {
    const url = `${env.BCB_API_BASE_URL}${sourceEndpoint}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Falha ao buscar série em ${url}: HTTP ${response.status}`);
    }

    const entries = (await response.json()) as BcbSeriesEntry[];

    return entries.map((entry) => ({
      date: parseBcbDate(entry.data),
      value: Number(entry.valor),
    }));
  }
}
