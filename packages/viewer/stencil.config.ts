import { Config } from '@stencil/core';
import { copyright } from '@vertexvis/rollup-plugin-vertexvis-copyright';
import { reactOutputTarget } from '@stencil/react-output-target';
import { angularOutputTarget } from '@stencil/angular-output-target';

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
    // angularOutputTarget({
    //   componentCorePackage: '@vertexvis/viewer',
    //   directivesProxyFile: '../viewer-angular/src/generated/proxies.ts',
    // }),
    {
      type: 'angular',
      componentCorePackage: '@vertexvis/viewer',
      directivesProxyFile:
        '../viewer-angular/src/generated/directives/proxies.ts',
      directivesUtilsFile:
        '../viewer-angular/src/generated/directives/proxies-utils.ts',
      directivesArrayFile:
        '../viewer-angular/src/generated/directives/proxies-list.ts',
    },
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
