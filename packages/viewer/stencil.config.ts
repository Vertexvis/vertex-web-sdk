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
        branches: 50,
        functions: 60,
        lines: 70,
        statements: 70,
      },
    },
    roots: ['<rootDir>/src/'],
  },
};
