import { Config } from '@stencil/core';
import { copyright } from '@vertexvis/rollup-plugin-vertexvis-copyright';
import { reactOutputTarget } from '@stencil/react-output-target';
import workers from '@vertexvis/rollup-plugin-web-workers';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import typescript2 from 'rollup-plugin-typescript2';
import { terser } from 'rollup-plugin-terser';

export const config: Config = {
  namespace: 'viewer',
  nodeResolve: {
    browser: true,
  },
  plugins: [
    copyright(),
    workers({
      plugins: [
        commonjs(),
        resolve({ browser: true }),
        typescript2(),
        terser(),
      ],
    }),
  ],
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
