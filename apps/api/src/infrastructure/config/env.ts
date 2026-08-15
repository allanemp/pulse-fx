import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3333),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL é obrigatória.'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  /**
   * Domínio base das APIs de dados abertos do Banco Central, usado pelo seed
   * (`prisma/seed.ts`) para buscar séries de indicadores. O complemento
   * específico de cada série (ex.: `/dados/serie/bcdata.sgs.4390/dados`) fica
   * salvo por indicador em `indicators.source_endpoint`, não aqui.
   */
  BCB_API_BASE_URL: z.string().url().default('https://api.bcb.gov.br'),
});

function loadEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('Variáveis de ambiente inválidas:', parsed.error.flatten().fieldErrors);
    throw new Error('Falha ao carregar a configuração da aplicação a partir do ambiente.');
  }

  return parsed.data;
}

/**
 * Configuração da aplicação validada uma única vez na inicialização.
 * Nenhuma outra parte do código deve ler `process.env` diretamente.
 */
export const env = loadEnv();
