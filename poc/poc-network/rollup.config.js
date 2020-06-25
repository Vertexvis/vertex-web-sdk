import {
  config,
  typescript,
  commonJs,
  minify,
  output,
  input,
} from '@vertexvis/build-tools';

/**
 * Configuration for Rollup.
 */
export default config(
  input('src/index.ts'),
  commonJs(),
  typescript(),
  output(),
  minify()
);
