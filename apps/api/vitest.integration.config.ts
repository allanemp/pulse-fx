import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/integration/**/*.test.ts'],
    // Cria/migra o banco de teste e cabe uma chamada HTTP real por caso —
    // mais folga que o padrão do Vitest (5s), sem exagerar.
    testTimeout: 30_000,
    hookTimeout: 30_000,
    // Um teste de cada vez: todos compartilham o mesmo Postgres de teste e
    // limpam as tabelas entre casos — rodar em paralelo faria um teste
    // apagar dado que outro ainda está usando.
    fileParallelism: false,
    env: {
      // env.ts exige esses valores pra montar a app (ver createApp) — os
      // testes de HTTP usam repositórios em memória, não tocam banco de
      // verdade, mas precisam de algo sintaticamente válido pra passar a
      // validação do Zod em infrastructure/config/env.ts.
      DATABASE_URL: 'postgresql://pulsefx:pulsefx@localhost:5432/pulsefx_test?schema=public',
      API_TOKEN: 'integration-test-token-not-a-real-secret-000000000000',
      CORS_ORIGIN: 'http://localhost:5173',
    },
  },
});
