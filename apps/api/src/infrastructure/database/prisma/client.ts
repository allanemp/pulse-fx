import { PrismaClient } from '@prisma/client';
import { env } from '../../config/env.js';

/**
 * Instância única do Prisma Client, compartilhada por toda a aplicação
 * (evita esgotar o pool de conexões do PostgreSQL abrindo um client por
 * requisição).
 */
export const prisma = new PrismaClient({
  log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});
