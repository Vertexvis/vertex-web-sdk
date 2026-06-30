import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import { Config } from '@stencil/core';
import { reactOutputTarget } from '@stencil/react-output-target';
import { vueOutputTarget } from '@stencil/vue-output-target';
import workers from '@vertexvis/rollup-plugin-web-workers';
import * as path from 'path';
import type { Plugin } from 'rollup';
import * as ts from 'typescript';

import jestConfig from './jest-shared.config';

export const config: Config = {
  namespace: 'viewer',
  sourceMap: true,
  nodeResolve: { browser: true },
  preamble: copyright(),
  plugins: [
    workers({
      plugins: [
        resolveThreadsEsm(),
        commonjs(),
        nodeResolve({ browser: true }),
        workerTypescript(),
        terser(),
      ],
    }),
  ],
  globalScript: 'src/polyfill/resize-observer.ts',
  globalStyle: 'src/css/global.css',
  outputTargets: [
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

// TODO: return to typescript2() from build-tools once that is updated in a way that can be used here.
function workerTypescript(): Plugin {
  return {
    name: 'worker-typescript',
    transform(code: string, id: string) {
      if (!id.endsWith('.ts')) {
        return null;
      }

      const output = ts.transpileModule(code, {
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2019,
        },
        fileName: id,
      });

      return { code: output.outputText, map: null };
    },
  };
}

function resolveThreadsEsm(): Plugin {
  return {
    name: 'resolve-threads-esm',
    resolveId(source: string) {
      if (source !== 'threads') {
        return null;
      }

      // Preserve the legacy resolver behavior. The package exports default
      // points at index.mjs, which omits `expose`; the module build includes it.
      return path.resolve(
        process.cwd(),
        '../../node_modules/threads/dist-esm/index.js'
      );
    },
  };
}
