import { execSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';

const TEST_DB_NAME = 'pulsefx_test';

/** Conecta no banco `pulsefx` (sempre existe) só pra ter permissão de criar o `pulsefx_test`. */
const ADMIN_DATABASE_URL =
  process.env.TEST_ADMIN_DATABASE_URL ??
  'postgresql://pulsefx:pulsefx@localhost:5432/pulsefx?schema=public';

export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  `postgresql://pulsefx:pulsefx@localhost:5432/${TEST_DB_NAME}?schema=public`;

/**
 * Cria (se não existir) e migra o banco de teste `pulsefx_test` — separado
 * do banco de desenvolvimento (`pulsefx`) de propósito: os testes de
 * integração apagam dados livremente entre casos, e isso nunca pode
 * arriscar o que está rodando em `npm run dev:api`/Docker. Idempotente —
 * rodar de novo não falha, só reaplica migrações pendentes.
 */
export async function ensureTestDatabase(): Promise<void> {
  const admin = new PrismaClient({ datasourceUrl: ADMIN_DATABASE_URL });

  try {
    await admin.$executeRawUnsafe(`CREATE DATABASE ${TEST_DB_NAME}`);
  } catch (error) {
    const alreadyExists = error instanceof Error && error.message.includes('already exists');

    if (!alreadyExists) {
      throw error;
    }
  } finally {
    await admin.$disconnect();
  }

  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: 'pipe',
  });
}

/** Limpa as tabelas entre testes — apagar Indicator já cascateia pra Observation/Favorite. */
export async function resetTestDatabase(prisma: PrismaClient): Promise<void> {
  await prisma.indicator.deleteMany();
}
