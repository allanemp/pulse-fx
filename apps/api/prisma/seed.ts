import { PrismaClient } from '@prisma/client';
import { SyncIndicatorObservations } from '../src/application/use-cases/SyncIndicatorObservations.js';
import { INDICATOR_SOURCES } from '../src/domain/gateways/IndicatorSources.js';
import { PrismaIndicatorRepository } from '../src/infrastructure/database/repositories/PrismaIndicatorRepository.js';
import { PrismaObservationRepository } from '../src/infrastructure/database/repositories/PrismaObservationRepository.js';
import { MapIndicatorDataSourceRegistry } from '../src/infrastructure/gateways/IndicatorDataSourceRegistry.js';
import { logger } from '../src/infrastructure/logging/logger.js';

/**
 * Seed de indicadores a partir de fontes externas — cadastra/atualiza o
 * indicador (upsert direto no Prisma, não via `RegisterIndicator`: esse
 * caso de uso rejeita nome duplicado, o comportamento certo para a API,
 * errado para reprocessar este script com segurança) e delega a busca das
 * observações para `SyncIndicatorObservations` — o mesmo caso de uso usado
 * pelo worker da fila de sincronização diária (ver
 * `src/infrastructure/queue`), para não duplicar a lógica de "como buscar
 * e gravar a série de um indicador" em dois lugares. Qual
 * `IndicatorDataSource` cada indicador usa é resolvido pelo mesmo
 * `IndicatorDataSourceRegistry` do worker, a partir do campo `source`.
 */
const prisma = new PrismaClient();

interface IndicatorSeedDefinition {
  name: string;
  unit: string;
  description: string;
  source: string;
  sourceEndpoint: string;
}

const INDICATORS: IndicatorSeedDefinition[] = [
  {
    name: 'Selic acumulada no mês',
    unit: '% a.m.',
    description:
      'Taxa de juros Selic acumulada no mês, expressa em percentual mensal. ' +
      'Fonte: Banco Central do Brasil, Sistema Gerenciador de Séries Temporais ' +
      '(SGS), série 4390. Dados publicados em dias úteis; o valor de um mês só ' +
      'fica completo após o fechamento do mês.',
    source: INDICATOR_SOURCES.BCB_SGS,
    sourceEndpoint: '/dados/serie/bcdata.sgs.4390/dados?formato=json',
  },
  {
    name: 'IPCA (variação mensal)',
    unit: '% a.m.',
    description:
      'Índice Nacional de Preços ao Consumidor Amplo (IPCA) — variação mensal, ' +
      'o índice oficial de inflação do Brasil, calculado pelo IBGE. Fonte: ' +
      'Banco Central do Brasil, SGS, série 433. Publicado mensalmente, em geral ' +
      'nos primeiros dias úteis do mês seguinte ao de referência.',
    source: INDICATOR_SOURCES.BCB_SGS,
    sourceEndpoint: '/dados/serie/bcdata.sgs.433/dados?formato=json',
  },
  {
    name: 'Dólar comercial (PTAX venda)',
    unit: 'BRL',
    description:
      'Cotação de venda do dólar americano (PTAX), taxa de referência oficial ' +
      'do Banco Central do Brasil para operações de câmbio, apurada ao final de ' +
      'cada dia útil. Fonte: Banco Central do Brasil, Olinda/PTAX. Diferente do ' +
      'SGS, é outra API do BCB, em outro domínio e formato — ver ' +
      'BcbPtaxIndicatorDataSource. Guarda só a cotação de venda; a de compra ' +
      'fica de fora do modelo atual.',
    source: INDICATOR_SOURCES.BCB_PTAX,
    // Para o PTAX, sourceEndpoint é a data de início da série (não uma URL) —
    // ver BcbPtaxIndicatorDataSource. Escolhida como um intervalo razoável
    // (~11 anos) para não deixar o seed lento em cada boot do Docker; dá pra
    // ampliar depois, é só trocar essa data.
    sourceEndpoint: '2015-01-01',
  },
];

async function seedIndicator(
  definition: IndicatorSeedDefinition,
  syncIndicatorObservations: SyncIndicatorObservations,
): Promise<void> {
  const indicator = await prisma.indicator.upsert({
    where: { name: definition.name },
    update: {
      unit: definition.unit,
      description: definition.description,
      source: definition.source,
      sourceEndpoint: definition.sourceEndpoint,
    },
    create: {
      name: definition.name,
      unit: definition.unit,
      description: definition.description,
      source: definition.source,
      sourceEndpoint: definition.sourceEndpoint,
    },
  });

  logger.info(`Indicador "${indicator.name}" (${indicator.id})`);

  const result = await syncIndicatorObservations.execute({ indicatorId: indicator.id });

  logger.info(`  ${result.observationsSynced} observações sincronizadas.`);
}

async function main(): Promise<void> {
  const indicatorRepository = new PrismaIndicatorRepository(prisma);
  const observationRepository = new PrismaObservationRepository(prisma);
  const dataSourceRegistry = new MapIndicatorDataSourceRegistry();
  const syncIndicatorObservations = new SyncIndicatorObservations(
    observationRepository,
    indicatorRepository,
    dataSourceRegistry,
  );

  for (const definition of INDICATORS) {
    await seedIndicator(definition, syncIndicatorObservations);
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
