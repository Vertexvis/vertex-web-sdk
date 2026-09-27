import { fileURLToPath } from 'node:url';

import { defineVitestConfig } from '@stencil/vitest/config';
import { stencilVitestPlugin } from '@stencil/vitest/plugin';

import { stencilClassExports } from './vitest.stencil-class-exports.ts';

// Shared with every project below since each project's `resolve` config
// replaces (rather than merges with) the root-level `resolve` config.
const testHelperAliases = [
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
];

export default defineVitestConfig({
  stencilConfig: './stencil.config.ts',
  oxc: {
    jsx: {
      runtime: 'classic',
      pragma: 'h',
      pragmaFrag: 'Fragment',
      development: false,
    },
  },
  plugins: [stencilVitestPlugin(), stencilClassExports()],
  resolve: {
    alias: [
      {
        find: /\.\/worker-url$/,
        replacement: fileURLToPath(
          new URL('./src/workers/__mocks__/worker-url.ts', import.meta.url),
        ),
      },
      {
        find: /^@stencil\/core$/,
        replacement: '@stencil/core/internal/client',
      },
      ...testHelperAliases,
    ],
  },
  test: {
    globals: true,
    maxWorkers: 2,
    projects: [
      {
        test: {
          name: 'unit',
          globals: true,
          environment: 'stencil',
          include: ['src/lib/**/*.spec.{ts,tsx}'],
          setupFiles: ['./vitest-setup.ts'],
        },
      },
      // {
      //   plugins: [stencilVitestPlugin(), stencilClassExports()],
      //   oxc: {
      //     jsx: {
      //       runtime: 'classic',
      //       pragma: 'h',
      //       pragmaFrag: 'Fragment',
      //       development: false,
      //     },
      //   },
      //   resolve: {
      //     alias: [
      //       {
      //         find: /^@stencil\/core$/,
      //         replacement: '@stencil/core/internal/client',
      //       },
      //       ...testHelperAliases,
      //     ],
      //   },
      //   test: {
      //     name: 'components',
      //     globals: true,
      //     environment: 'stencil',
      //     include: ['src/components/**/*.spec.{ts,tsx}'],
      //     exclude: [
      //       'src/components/scene-tree-table-cell/scene-tree-table-cell.spec.tsx',
      //       'src/components/viewer-pin-label/viewer-pin-label.render.spec.tsx',
      //       'src/components/viewer-pin-label/viewer-pin-label.spec.tsx',
      //     ],
      //     setupFiles: ['./vitest-setup.ts'],
      //   },
      // },
      {
        plugins: [stencilVitestPlugin(), stencilClassExports()],
        oxc: {
          jsx: {
            runtime: 'classic',
            pragma: 'h',
            pragmaFrag: 'Fragment',
            development: false,
          },
        },
        resolve: {
          alias: [
            {
              find: /^@stencil\/core$/,
              replacement: '@stencil/core/internal/client',
            },
            ...testHelperAliases,
          ],
        },
        test: {
          name: 'component-dom',
          globals: true,
          environment: 'stencil',
          environmentOptions: { stencil: { domEnvironment: 'happy-dom' } },
          include: ['src/components/**/*.spec.{ts,tsx}'],
          // include: [
          //   'src/components/scene-tree-table-cell/scene-tree-table-cell.spec.tsx',
          //   'src/components/viewer-pin-label/viewer-pin-label.render.spec.tsx',
          //   'src/components/viewer-pin-label/viewer-pin-label.spec.tsx',
          // ],
          setupFiles: ['./vitest-setup.ts'],
        },
      },
    ],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/__*__/**', 'src/testing/**'],
      thresholds: { branches: 68, functions: 80, lines: 86, statements: 85 },
    },
  },
});
