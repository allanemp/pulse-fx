import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
  },
  test: {
    // Padrão leve (sem DOM) — os testes que renderizam componente ligam
    // jsdom por arquivo com `// @vitest-environment jsdom` no topo, em vez
    // de pagar o custo do jsdom no suite inteiro (a maioria dos testes é
    // de lógica pura, não precisa de DOM).
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
  },
});
