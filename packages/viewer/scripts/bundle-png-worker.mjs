import { readdir, readFile } from 'node:fs/promises';

import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { rollup } from 'rollup';
import ts from 'typescript';

const packageDirectory = new URL('..', import.meta.url);
const workerEntry = new URL(
  '../src/workers/png-decoder.worker.ts',
  import.meta.url,
);
// Each Stencil distribution contains modules that construct the worker URL
// relative to themselves. Keep a copy beside every such module, including the
// custom-elements entry consumed by viewer-react.
const outputDirectories = [
  'dist/cjs',
  'dist/components',
  'dist/esm',
  'dist/viewer',
];
const dev = process.argv.includes('--dev');

const bundle = await rollup({
  input: workerEntry.pathname,
  plugins: [
    nodeResolve({ browser: true }),
    commonjs(),
    {
      name: 'transpile-worker-typescript',
      transform(code, id) {
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
    },
  ],
});

try {
  if (dev) {
    // Let Stencil own development output writes and cleanup. Do not write to
    // dist here: the custom output target consumes this bundle from stdout.
    const { output } = await bundle.generate({ format: 'iife' });
    process.stdout.write(output[0].code);
  } else {
    await Promise.all(
      outputDirectories.map((directory) =>
        bundle.write({
          file: new URL(`${directory}/png-decoder.worker.js`, packageDirectory)
            .pathname,
          format: 'iife',
        }),
      ),
    );
  }
} finally {
  await bundle.close();
}

// Development output targets run concurrently, so Stencil's bundles may not
// exist yet. Validate their worker URLs only after the production build.
if (!dev) {
  await Promise.all(
    outputDirectories.map(async (directory) => {
      const outputDirectory = new URL(`${directory}/`, packageDirectory);
      const files = await readdir(outputDirectory);
      const bundleFiles = await Promise.all(
        files
          .filter(
            (file) => file.endsWith('.js') && file !== 'png-decoder.worker.js',
          )
          .map((file) => readFile(new URL(file, outputDirectory), 'utf8')),
      );

      if (!bundleFiles.some((file) => file.includes('png-decoder.worker.js'))) {
        throw new Error(`PNG worker URL was not emitted in ${directory}`);
      }

      if (bundleFiles.some((file) => file.includes('png-decoder.worker.ts'))) {
        throw new Error(`PNG worker TypeScript URL remains in ${directory}`);
      }
    }),
  );
}
