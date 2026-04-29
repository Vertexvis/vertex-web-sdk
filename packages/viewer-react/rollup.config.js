import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { rollupConfig } from '@vertexwebsdk/build';
import fs from 'fs';
import path from 'path';

const baseConfig = rollupConfig({ external: [/^@vertexvis\/viewer/] });

// Preserve 'use client' directive for React Server Components compatibility.
const useClientPlugin = {
  name: 'use-client-directive',
  renderChunk(code) {
    return { code: `'use client';\n${code}`, map: null };
  },
};

const addUseClient = (config) => ({
  ...config,
  onwarn(warning, warn) {
    // Suppress the 'use client' directive warning since we handle it in renderChunk.
    if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
    warn(warning);
  },
  plugins: [...(config.plugins || []), useClientPlugin],
});

const clientConfig = Array.isArray(baseConfig)
  ? baseConfig.map(addUseClient)
  : [addUseClient(baseConfig)];

const copyServerTypesPlugin = {
  name: 'copy-server-types',
  writeBundle() {
    fs.copyFileSync(
      path.resolve('src/index.server.d.ts'),
      path.resolve('dist/index.server.d.ts')
    );
  },
};

const serverConfig = {
  external: (source) => !source.startsWith('.') && !source.startsWith('/'),
  input: 'src/index.server.js',
  onwarn(warning, warn) {
    if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
    warn(warning);
  },
  output: [
    {
      file: 'dist/bundle.server.cjs.js',
      format: 'cjs',
      sourcemap: true,
    },
    {
      file: 'dist/bundle.server.esm.js',
      format: 'esm',
      sourcemap: true,
    },
  ],
  plugins: [
    nodeResolve({
      extensions: ['.mjs', '.js', '.json', '.node', '.ts', '.tsx'],
      exportConditions: ['react-server', 'node', 'import', 'default'],
    }),
    commonjs(),
    useClientPlugin,
    copyServerTypesPlugin,
  ],
};

export default [...clientConfig, serverConfig];
