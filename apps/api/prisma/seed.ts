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
  {
    name: 'Fed Funds Rate (EUA)',
    unit: '% a.a.',
    description:
      'Taxa de juros básica dos Estados Unidos (Federal Funds Effective Rate), ' +
      'definida pelo Federal Reserve — o par direto da Selic: o diferencial ' +
      'entre as duas é um dos principais motores da cotação USD/BRL. Fonte: ' +
      'FRED (Federal Reserve Economic Data), série DFF. Publicada diariamente ' +
      '(dias úteis).',
    source: INDICATOR_SOURCES.FRED,
    // Para o FRED, sourceEndpoint é "{series_id}:{data_de_início}" — ver
    // FredIndicatorDataSource. Mesma janela de 2015 em diante usada no PTAX,
    // pra comparar Selic x Fed Funds Rate no mesmo período.
    sourceEndpoint: 'DFF:2015-01-01',
  },
  {
    name: 'CPI americano (variação mensal)',
    unit: '% a.m.',
    description:
      'Consumer Price Index for All Urban Consumers (CPI-U) — o índice oficial ' +
      'de inflação dos Estados Unidos, o par direto do IPCA. Fonte: FRED, série ' +
      'CPIAUCSL, já pedida como variação percentual mês a mês (não o índice ' +
      'bruto) para ficar comparável ao formato do IPCA. Publicado mensalmente.',
    source: INDICATOR_SOURCES.FRED,
    // "pch" pede ao próprio FRED a série já transformada em variação % mês a
    // mês — ver o comentário sobre "units" em FredIndicatorDataSource.
    sourceEndpoint: 'CPIAUCSL:2015-01-01:pch',
  },
  {
    name: 'Treasury 10 anos (EUA)',
    unit: '% a.a.',
    description:
      'Rendimento (yield) dos títulos do Tesouro americano de 10 anos — uma das ' +
      'principais referências de taxa de juros de longo prazo do mundo, usada ' +
      'como benchmark para precificar outros ativos. Fonte: FRED, série DGS10. ' +
      'Publicada diariamente (dias úteis).',
    source: INDICATOR_SOURCES.FRED,
    sourceEndpoint: 'DGS10:2015-01-01',
  },
  {
    name: 'Índice do dólar (trade-weighted, EUA)',
    unit: 'índice',
    description:
      'Nominal Broad U.S. Dollar Index — mede a força do dólar americano frente ' +
      'a uma cesta ampla de moedas dos principais parceiros comerciais dos EUA ' +
      '(não só o real); quanto maior, mais forte o dólar globalmente. Fonte: ' +
      'FRED, série DTWEXBGS. Publicada em dias úteis.',
    source: INDICATOR_SOURCES.FRED,
    sourceEndpoint: 'DTWEXBGS:2015-01-01',
  },
  {
    name: 'Taxa de desemprego (EUA)',
    unit: '%',
    description:
      'Taxa de desemprego dos Estados Unidos — um dos principais indicadores de ' +
      'saúde da economia americana, acompanhado de perto pelo Federal Reserve ' +
      'nas decisões sobre a taxa de juros (Fed Funds Rate). Fonte: FRED, série ' +
      'UNRATE. Publicada mensalmente.',
    source: INDICATOR_SOURCES.FRED,
    sourceEndpoint: 'UNRATE:2015-01-01',
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
