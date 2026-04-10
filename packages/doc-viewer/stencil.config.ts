import { Config } from '@stencil/core';
import { reactOutputTarget } from '@stencil/react-output-target';
import { vueOutputTarget } from '@stencil/vue-output-target';
import copy from 'rollup-plugin-copy';

import jestConfig from './jest-shared.config';
import path from 'path';

export const config: Config = {
  namespace: 'doc-viewer',
  preamble: copyright(),
  globalScript: 'src/polyfill/index.ts',
  globalStyle: 'src/css/global.css',
  outputTargets: [
    reactOutputTarget({
      stencilPackageName: '@vertexvis/doc-viewer',
      outDir: '../doc-viewer-react/src/generated',
    }),
    vueOutputTarget({
      componentCorePackage: '@vertexvis/doc-viewer',
      proxiesFile: '../doc-viewer-vue/src/generated/components.ts',
    }),
    {
      type: 'dist',
      esmLoaderPath: '../loader',
      copy: [
        {
          src: '**/pdf.worker.min.mjs',
          dest: 'assets',
          warn: true,
        },
      ],
    },
    {
      type: 'dist-custom-elements',
      customElementsExportBehavior: 'auto-define-custom-elements',
      externalRuntime: false,
      copy: [
        {
          src: '**/pdf.worker.min.mjs',
          dest: 'dist/components/assets',
          warn: true,
        },
      ],
    },
    {
      type: 'docs-readme',
    },
  ],
  rollupPlugins: {
    after: [
      copy({
        targets: [
          {
            src: 'assets/**',
            dest: 'dist/assets',
          },
        ],
      }),
    ]
  },
  testing: { ...jestConfig },
  extras: {
    enableImportInjection: true,
  },
};

function copyright(): string {
  const year = new Date(Date.now()).getFullYear();
  return `Copyright (c) ${year} Vertex Software LLC. All rights reserved.`;
}
