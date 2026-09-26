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
      exclude: ['src/**/__tests__/**'],
      thresholds: { branches: 90, functions: 90, lines: 80, statements: 85 },
    },
  },
});
