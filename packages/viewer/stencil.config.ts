import { Config } from '@stencil/core';
import { copyright } from '@vertexvis/rollup-plugin-vertexvis-copyright';
import { reactOutputTarget } from '@stencil/react-output-target';

export const config: Config = {
  namespace: 'viewer',
  nodeResolve: {
    browser: true,
  },
  plugins: [copyright()],
  globalStyle: 'src/global/index.css',
  outputTargets: [
    reactOutputTarget({
      componentCorePackage: '@vertexvis/viewer',
      proxiesFile: '../viewer-react/src/generated/components.ts',
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
        branches: 60,
        functions: 70,
        lines: 80,
        statements: 78,
      },
    },
    roots: ['<rootDir>/src/'],
  },
  extras: {
    dynamicImportShim: true,
    shadowDomShim: true,
  },
};
