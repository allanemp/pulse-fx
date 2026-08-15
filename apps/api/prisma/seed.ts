import { PrismaClient } from '@prisma/client';
import { SyncIndicatorObservations } from '../src/application/use-cases/SyncIndicatorObservations.js';
import { PrismaIndicatorRepository } from '../src/infrastructure/database/repositories/PrismaIndicatorRepository.js';
import { PrismaObservationRepository } from '../src/infrastructure/database/repositories/PrismaObservationRepository.js';
import { BcbIndicatorDataSource } from '../src/infrastructure/gateways/BcbIndicatorDataSource.js';
import { logger } from '../src/infrastructure/logging/logger.js';

/**
 * Seed de indicadores a partir de fontes externas — cadastra/atualiza o
 * indicador (upsert direto no Prisma, não via `RegisterIndicator`: esse
 * caso de uso rejeita nome duplicado, o comportamento certo para a API,
 * errado para reprocessar este script com segurança) e delega a busca das
 * observações para `SyncIndicatorObservations` — o mesmo caso de uso usado
 * pelo worker da fila de sincronização diária (ver
 * `src/infrastructure/queue`), para não duplicar a lógica de "como buscar
 * e gravar a série de um indicador" em dois lugares.
 */
const prisma = new PrismaClient();

interface IndicatorSeedDefinition {
  name: string;
  unit: string;
  description: string;
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
    sourceEndpoint: '/dados/serie/bcdata.sgs.4390/dados?formato=json',
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
      sourceEndpoint: definition.sourceEndpoint,
    },
    create: {
      name: definition.name,
      unit: definition.unit,
      description: definition.description,
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
  const dataSource = new BcbIndicatorDataSource();
  const syncIndicatorObservations = new SyncIndicatorObservations(
    observationRepository,
    indicatorRepository,
    dataSource,
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
