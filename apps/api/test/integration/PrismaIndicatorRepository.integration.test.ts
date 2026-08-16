import { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PrismaIndicatorRepository } from '../../src/infrastructure/database/repositories/PrismaIndicatorRepository.js';
import { ensureTestDatabase, resetTestDatabase, TEST_DATABASE_URL } from './testDatabase.js';

/**
 * Testes de integração de verdade — batem num Postgres real (`pulsefx_test`,
 * separado do banco de dev), não num fake em memória. O que isso pega que
 * os testes unitários (com `InMemoryIndicatorRepository`) não pegam: o
 * mapeamento Prisma -> entidade de domínio de fato funcionando contra o
 * schema real (tipos de coluna, nullability, `@@map`).
 */
describe('PrismaIndicatorRepository (integração)', () => {
  const prisma = new PrismaClient({ datasourceUrl: TEST_DATABASE_URL });
  const repository = new PrismaIndicatorRepository(prisma);

  beforeAll(async () => {
    await ensureTestDatabase();
  }, 30_000);

  beforeEach(async () => {
    await resetTestDatabase(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('findById devolve null quando o indicador não existe', async () => {
    const result = await repository.findById('00000000-0000-0000-0000-000000000000');

    expect(result).toBeNull();
  });

  it('findById mapeia a linha do banco pra entidade de domínio, incluindo frequency', async () => {
    const row = await prisma.indicator.create({
      data: {
        name: 'Selic acumulada no mês',
        unit: '% a.m.',
        description: 'Taxa Selic.',
        source: 'bcb-sgs',
        sourceEndpoint: '/dados/serie/bcdata.sgs.4390/dados?formato=json',
        frequency: 'monthly',
      },
    });

    const indicator = await repository.findById(row.id);

    expect(indicator).not.toBeNull();
    expect(indicator?.name).toBe('Selic acumulada no mês');
    expect(indicator?.unit).toBe('% a.m.');
    expect(indicator?.source).toBe('bcb-sgs');
    expect(indicator?.frequency).toBe('monthly');
    expect(indicator?.createdAt).toBeInstanceOf(Date);
  });

  it('findById mapeia campos opcionais ausentes (null no banco) como undefined na entidade', async () => {
    const row = await prisma.indicator.create({
      data: { name: 'Indicador sem sincronização', frequency: 'daily' },
    });

    const indicator = await repository.findById(row.id);

    expect(indicator?.unit).toBeUndefined();
    expect(indicator?.description).toBeUndefined();
    expect(indicator?.source).toBeUndefined();
    expect(indicator?.sourceEndpoint).toBeUndefined();
  });

  it('findMany lista todos os indicadores cadastrados', async () => {
    await prisma.indicator.create({ data: { name: 'Selic', frequency: 'monthly' } });
    await prisma.indicator.create({ data: { name: 'IPCA', frequency: 'monthly' } });

    const indicators = await repository.findMany();

    expect(indicators.map((i) => i.name).sort()).toEqual(['IPCA', 'Selic']);
  });

  it('findSyncable só devolve indicadores com source e sourceEndpoint definidos', async () => {
    await prisma.indicator.create({
      data: {
        name: 'Sincronizável',
        source: 'bcb-sgs',
        sourceEndpoint: '/dados/serie/bcdata.sgs.4390/dados?formato=json',
        frequency: 'monthly',
      },
    });
    await prisma.indicator.create({
      data: { name: 'Sem sincronização automática', frequency: 'daily' },
    });

    const syncable = await repository.findSyncable();

    expect(syncable).toHaveLength(1);
    expect(syncable[0]?.name).toBe('Sincronizável');
  });
});
