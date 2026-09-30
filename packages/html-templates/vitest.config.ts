import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@vertexvis/utils': fileURLToPath(
        new URL('../utils/src/index.ts', import.meta.url),
      ),
    },
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    include: ['src/**/*.{spec,test}.{ts,tsx}'],
    setupFiles: ['../../vitest.setup.console.ts'],
    maxWorkers: 2,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/__tests__/**', 'src/**/testing/**'],
      thresholds: { branches: 65, functions: 55, lines: 55, statements: 60 },
    },
  },
});
