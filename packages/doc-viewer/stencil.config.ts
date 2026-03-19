import { Config } from '@stencil/core';

import jestConfig from './jest-shared.config';

export const config: Config = {
  namespace: 'doc-viewer',
  preamble: copyright(),
  globalScript: 'src/polyfill/resize-observer.ts',
  globalStyle: 'src/css/global.css',
  outputTargets: [
    {
      type: 'dist',
      esmLoaderPath: '../loader',
      copy: [
        {
          src: '**/pdf.worker.min.mjs',
          dest: 'dist/assets',
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
          dest: 'dist/assets',
          warn: true,
        },
      ],
    },
    {
      type: 'docs-readme',
    },
  ],
  testing: { ...jestConfig },
  extras: {
    enableImportInjection: true,
  },
};

function copyright(): string {
  const year = new Date(Date.now()).getFullYear();
  return `Copyright (c) ${year} Vertex Software LLC. All rights reserved.`;
}
