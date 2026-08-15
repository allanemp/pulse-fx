import { z } from 'zod';
import type {
  IndicatorDataPoint,
  IndicatorDataSource,
} from '../../domain/gateways/IndicatorDataSource.js';
import { env } from '../config/env.js';

/** Formato retornado pelo SGS/BCB: `[{"data":"DD/MM/YYYY","valor":"1.16"}, ...]`. */
const sgsResponseSchema = z.array(z.object({ data: z.string(), valor: z.string() }));

function parseBcbDate(value: string): Date {
  const [dayStr, monthStr, yearStr] = value.split('/');

  if (!dayStr || !monthStr || !yearStr) {
    throw new Error(`Data em formato inesperado: "${value}" (esperado DD/MM/YYYY).`);
  }

  return new Date(Date.UTC(Number(yearStr), Number(monthStr) - 1, Number(dayStr)));
}

/**
 * Busca séries no SGS (Sistema Gerenciador de Séries Temporais) do Banco
 * Central. `sourceEndpoint` é o complemento salvo por indicador (ex.:
 * `/dados/serie/bcdata.sgs.4390/dados?formato=json`); o domínio
 * (`BCB_API_BASE_URL`) é o mesmo para qualquer indicador dessa fonte —
 * confirmado testando séries diferentes (Selic 4390, IPCA 433): o SGS
 * devolve sempre o mesmo formato genérico `{data, valor}`, não importa o
 * indicador. Isso NÃO vale para outras APIs do BCB (ex.: o PTAX, servido
 * por outro domínio com outro formato — ver `BcbPtaxIndicatorDataSource`).
 *
 * Valida a forma da resposta com Zod antes de interpretar qualquer coisa:
 * se o SGS um dia mudar o formato, falha aqui com uma mensagem clara, em
 * vez de propagar `NaN`/`Invalid Date` silenciosamente pro banco.
 */
export class BcbSgsIndicatorDataSource implements IndicatorDataSource {
  async fetchSeries(sourceEndpoint: string): Promise<IndicatorDataPoint[]> {
    const url = `${env.BCB_API_BASE_URL}${sourceEndpoint}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Falha ao buscar série em ${url}: HTTP ${response.status}`);
    }

    const parsed = sgsResponseSchema.safeParse(await response.json());

    if (!parsed.success) {
      throw new Error(`Resposta do SGS em formato inesperado em ${url}: ${parsed.error.message}`);
    }

    return parsed.data.map((entry) => ({
      date: parseBcbDate(entry.data),
      value: Number(entry.valor),
    }));
  }
}
