import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['src/**/*.{spec,test}.{ts,tsx}'],
    setupFiles: ['../../vitest.setup.console.ts'],
    maxWorkers: 2,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/__tests__/**', 'src/**/testing/**'],
      thresholds: { branches: 80, functions: 90, lines: 88, statements: 88 },
    },
  },
});
