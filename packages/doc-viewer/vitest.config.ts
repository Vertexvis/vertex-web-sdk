import { fileURLToPath } from 'node:url';

import { defineVitestConfig } from '@stencil/vitest/config';
import { stencilVitestPlugin } from '@stencil/vitest/plugin';

export default defineVitestConfig({
  stencilConfig: './stencil.config.ts',
  oxc: { jsx: { runtime: 'classic', pragma: 'h', pragmaFrag: 'Fragment', development: false } },
  plugins: [stencilVitestPlugin()],
  resolve: {
    alias: [
      { find: /^@stencil\/core$/, replacement: '@stencil/core/internal/client' },
      { find: 'pdfjs-dist/legacy/build/pdf.mjs', replacement: './src/__mocks__/pdfjs-mock.ts' },
      {
        find: '#test/mock-types',
        replacement: fileURLToPath(
          new URL('../../vitest.mock-types.ts', import.meta.url),
        ),
      },
      {
        find: '#test/render-spec-page',
        replacement: fileURLToPath(
          new URL('../../vitest.render-spec-page.ts', import.meta.url),
        ),
      },
    ],
  },
  test: {
    globals: true,
    environment: 'stencil',
    // Keep Stencil's mock-doc semantics used by the existing component specs.
    include: ['src/**/*.spec.{ts,tsx}'],
    setupFiles: ['./vitest-setup.ts'],
    maxWorkers: 1,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/__*__/**', 'src/testing/**', 'src/assets/**', 'src/polyfill/**'],
      thresholds: { branches: 68, functions: 80, lines: 86, statements: 85 },
    },
  },
});
