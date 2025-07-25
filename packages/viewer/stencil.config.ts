import { Config } from '@stencil/core';
import { reactOutputTarget } from '@stencil/react-output-target';
import { vueOutputTarget } from '@stencil/vue-output-target';
import workers from '@vertexvis/rollup-plugin-web-workers';
import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import typescript2 from 'rollup-plugin-typescript2';

import jestConfig from './jest-shared.config';

export const config: Config = {
  namespace: 'viewer',
  sourceMap: true,
  nodeResolve: { browser: true },
  preamble: copyright(),
  plugins: [
    workers({
      plugins: [
        commonjs(),
        resolve({ browser: true }),
        typescript2(),
        terser(),
      ],
    }),
  ],
  globalScript: 'src/polyfill/resize-observer.ts',
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
    vueOutputTarget({
      componentCorePackage: '@vertexvis/viewer',
      proxiesFile: '../viewer-vue/src/generated/components.ts',
    }),
    {
      type: 'dist',
      esmLoaderPath: '../loader',
    },
    {
      type: 'dist-custom-elements',
      autoDefineCustomElements: true,
      minify: true,
    },
    {
      type: 'docs-readme',
    },
  ],
  testing: { ...jestConfig },
  extras: {
    dynamicImportShim: true,
    shadowDomShim: true,
    experimentalImportInjection: true,
  },
};

function copyright(): string {
  const year = new Date(Date.now()).getFullYear();
  return `Copyright (c) ${year} Vertex Software LLC. All rights reserved.`;
}
