import { PrismaClient } from '@prisma/client';
import { env } from '../src/infrastructure/config/env.js';
import { logger } from '../src/infrastructure/logging/logger.js';

/**
 * Seed de indicadores/observações a partir de fontes externas.
 *
 * Diferente do restante da API, este script fala direto com o Prisma
 * (upsert idempotente) em vez de passar pelos casos de uso: seeds são uma
 * ferramenta de bootstrap de dados, não uma requisição de um usuário, e
 * `RegisterIndicator`/`RegisterObservation` são desenhados para rejeitar
 * duplicatas (o comportamento certo para a API, errado para reprocessar
 * este script com segurança).
 *
 * Cada indicador guarda seu próprio complemento de URL (`sourceEndpoint`);
 * o domínio base da fonte fica em `BCB_API_BASE_URL` (env), combinados aqui
 * na hora de buscar os dados.
 */
const prisma = new PrismaClient();

interface IndicatorSeedDefinition {
  name: string;
  sourceEndpoint: string;
}

const INDICATORS: IndicatorSeedDefinition[] = [
  {
    name: 'Selic acumulada no mês',
    sourceEndpoint: '/dados/serie/bcdata.sgs.4390/dados?formato=json',
  },
];

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

async function fetchSeries(sourceEndpoint: string): Promise<BcbSeriesEntry[]> {
  const url = `${env.BCB_API_BASE_URL}${sourceEndpoint}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Falha ao buscar série em ${url}: HTTP ${response.status}`);
  }

  return (await response.json()) as BcbSeriesEntry[];
}

async function seedIndicator(definition: IndicatorSeedDefinition): Promise<void> {
  const indicator = await prisma.indicator.upsert({
    where: { name: definition.name },
    update: { sourceEndpoint: definition.sourceEndpoint },
    create: { name: definition.name, sourceEndpoint: definition.sourceEndpoint },
  });

  logger.info(`Indicador "${indicator.name}" (${indicator.id})`);

  const entries = await fetchSeries(definition.sourceEndpoint);
  logger.info(
    `  ${entries.length} observações encontradas em ${env.BCB_API_BASE_URL}${definition.sourceEndpoint}`,
  );

  for (const entry of entries) {
    await prisma.observation.upsert({
      where: { indicatorId_date: { indicatorId: indicator.id, date: parseBcbDate(entry.data) } },
      update: { value: Number(entry.valor) },
      create: {
        indicatorId: indicator.id,
        date: parseBcbDate(entry.data),
        value: Number(entry.valor),
      },
    });
  }

  logger.info(`  ${entries.length} observações upsertadas.`);
}

async function main(): Promise<void> {
  for (const definition of INDICATORS) {
    await seedIndicator(definition);
  }
}

main()
  .catch((error: unknown) => {
    logger.error({ err: error }, 'Falha ao rodar o seed');
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
