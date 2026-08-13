import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import { Config } from '@stencil/core';
import { reactOutputTarget } from '@stencil/react-output-target';
import { vueOutputTarget } from '@stencil/vue-output-target';
import * as path from 'path';
import { type Plugin, rollup } from 'rollup';
import * as ts from 'typescript';

import jestConfig from './jest-shared.config';

export const config: Config = {
  namespace: 'viewer',
  sourceMap: true,
  nodeResolve: { browser: true },
  preamble: copyright(),
  plugins: [
    nativeWorkers({
      plugins: [
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

const nativeWorkerPrefix = 'native-worker:';

function nativeWorkers({ plugins = [] }: { plugins?: Plugin[] }): Plugin {
  return {
    name: 'native-workers',
    async resolveId(source: string, importer) {
      if (!source.startsWith(nativeWorkerPrefix)) {
        return null;
      }

      const resolved = await this.resolve(
        source.slice(nativeWorkerPrefix.length),
        importer ?? '',
      );
      return resolved == null
        ? null
        : {
            id: `${nativeWorkerPrefix}${resolved.id}`,
            moduleSideEffects: false,
          };
    },
    async load(id: string) {
      if (!id.startsWith(nativeWorkerPrefix)) {
        return null;
      }

      const filePath = id.slice(nativeWorkerPrefix.length);
      const build = await rollup({ input: filePath, plugins });
      const bundle = await build.generate({ format: 'iife' });
      const chunks = bundle.output.filter((output) => output.type === 'chunk');
      if (chunks.length !== 1 || chunks[0].type !== 'chunk') {
        throw new Error('Native worker should generate exactly one chunk.');
      }

      const chunk = chunks[0];
      if (chunk.imports.length > 0) {
        throw new Error('Native worker should not contain imports.');
      }

      const workerName = `${path.basename(filePath, path.extname(filePath))}-worker`;
      return `
const workerText = ${JSON.stringify(chunk.code)};
export function makeWorker() {
  const url = URL.createObjectURL(new Blob([workerText], { type: 'text/javascript' }));
  const worker = new Worker(url, { name: ${JSON.stringify(workerName)} });
  URL.revokeObjectURL(url);
  return worker;
}`;
    },
  };
}
