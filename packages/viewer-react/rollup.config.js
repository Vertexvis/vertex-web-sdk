import { rollupConfig } from '@vertexwebsdk/build';

export default rollupConfig({ external: ['@vertexvis/viewer/loader'] });

// import commonjs from '@rollup/plugin-commonjs';
// import resolve from '@rollup/plugin-node-resolve';
// import typescript from 'rollup-plugin-typescript2';

// export default {
//   input: './src/index.ts',
//   output: {
//     file: './dist/bundle.esm.js',
//     format: 'esm',
//   },
//   external: ['@vertexvis/viewer/loader'],
//   plugins: [commonjs(), resolve(), typescript()],
// };
