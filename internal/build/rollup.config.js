import { config, input, output, typescript } from '@vertexvis/build-tools';

const rollupConfig = config(
  input('src/index.ts'),
  typescript(),
  output({
    formats: ['cjs', 'esm'],
    inlineDynamicImports: true,
  }),
);

export default {
  ...rollupConfig,
  output: rollupConfig.output.map((bundle) => ({
    ...bundle,
    file: bundle.format === 'cjs' ? 'dist/bundle.cjs' : 'dist/bundle.js',
  })),
};
