import { Config } from '@stencil/core';
import { copyright } from '@vertexvis/rollup-plugin-vertexvis-copyright';
import { reactOutputTarget } from '@stencil/react-output-target';

export const config: Config = {
  namespace: 'viewer',
  nodeResolve: {
    browser: true,
  },
  plugins: [copyright()],
  globalStyle: 'src/css/global.css',
  outputTargets: [
    reactOutputTarget({
      componentCorePackage: '@vertexvis/viewer',
      proxiesFile: '../viewer-react/src/generated/components.ts',
      excludeComponents: [
        // Omitted because the React scene tree component doesn't support
        // rendering a row as a React element.
        'vertex-scene-tree-row',
      ],
    }),
    {
      type: 'dist',
      esmLoaderPath: '../loader',
    },
    {
      type: 'docs-readme',
    },
  ],
  testing: {
    collectCoverageFrom: ['**/src/**/*.{ts,tsx}'],
    coveragePathIgnorePatterns: ['src/testing'],
    coverageThreshold: {
      global: {
        branches: 68,
        functions: 80,
        lines: 86,
        statements: 85,
      },
    },
    roots: ['<rootDir>/src/'],
  },
  extras: {
    dynamicImportShim: true,
    shadowDomShim: true,
  },
};
