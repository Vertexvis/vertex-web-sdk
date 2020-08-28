import { Config } from '@stencil/core';
import { copyright } from '@vertexvis/rollup-plugin-vertexvis-copyright';
import { reactOutputTarget } from '@stencil/react-output-target';

export const config: Config = {
  namespace: 'viewer',
  nodeResolve: {
    browser: true,
  },
  commonjs: {
    namedExports: {
      'protobufjs/minimal': [
        'build',
        'Writer',
        'BufferWriter',
        'Reader',
        'BufferReader',
        'util',
        'rpc',
        'roots',
        'configure',
      ],
    },
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
    {
      type: 'www',
      serviceWorker: null, // disable service workers
    },
  ],
  testing: {
    collectCoverageFrom: ['**/src/**/*.{ts,tsx}'],
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
};
