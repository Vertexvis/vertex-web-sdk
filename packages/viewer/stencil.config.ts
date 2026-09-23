import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import { Config } from '@stencil/core';
import { reactOutputTarget } from '@stencil/react-output-target';
import { vueOutputTarget } from '@stencil/vue-output-target';

import jestConfig from './jest-shared.config';

export const config: Config = {
  namespace: 'viewer',
  sourceMap: true,
  nodeResolve: { browser: true },
  preamble: copyright(),
  globalScript: 'src/polyfill/resize-observer.ts',
  globalStyle: 'src/css/global.css',
  outputTargets: [
    {
      type: 'custom',
      name: 'png-decoder-worker',
      async generator(config, compilerCtx) {
        if (config.devMode) {
          const { stdout } = await promisify(execFile)(
            process.execPath,
            [`${config.rootDir}/scripts/bundle-png-worker.mjs`, '--dev'],
            { maxBuffer: 10 * 1024 * 1024 },
          );
          // Queue the bundle in Stencil's filesystem so it owns output writes
          // and cleanup, without reading intermediate files from dist.
          await Promise.all(
            ['cjs', 'components', 'esm', 'viewer'].map(async (directory) => {
              const file = `${config.rootDir}/dist/${directory}/png-decoder.worker.js`;
              await compilerCtx.fs.writeFile(file, stdout);
            }),
          );
        }
      },
    },
    reactOutputTarget({
      outDir: '../viewer-react/src/generated/',
      stencilPackageName: '@vertexvis/viewer',
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
      customElementsExportBehavior: 'auto-define-custom-elements',
      externalRuntime: false,
      minify: true,
    },
    {
      type: 'docs-readme',
    },
  ],
  testing: { ...jestConfig },
  extras: {
    experimentalImportInjection: true,
  },
  hydratedFlag: {
    selector: 'attribute',
  },
};

function copyright(): string {
  const year = new Date(Date.now()).getFullYear();
  return `Copyright (c) ${year} Vertex Software LLC. All rights reserved.`;
}
