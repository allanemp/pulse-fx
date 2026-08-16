import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    // Só unitários — precisam de zero infraestrutura externa (fakes/repos
    // em memória), pra `npm test` rodar rápido em qualquer máquina. Os de
    // integração (test/integration/) exigem um Postgres real e têm config
    // própria (ver vitest.integration.config.ts / `npm run test:integration`).
    include: ['test/unit/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/domain/**', 'src/application/**'],
    },
  },
});
