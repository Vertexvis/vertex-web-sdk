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
 *
 * We provide Rollup with two configurations to create bundles for a Node
 * environment and browser environment. This is necessary as the `uuid` package
 * depends on the `crypto` node module, which will not work in a browser
 * environment. The generated browser bundle will tell `uuid` to include shims
 * for `crypto`.
 */
export default [
  config(
    input('src/index.ts'),
    commonJs({ commonjs: { namedExports: { uuid: ['v1'] } } }),
    typescript(),
    output(),
    minify()
  ),
  config(
    input('src/index.ts'),
    commonJs({
      commonjs: { namedExports: { uuid: ['v1'] } },
      nodeResolve: { browser: true },
    }),
    typescript(),
    output({ bundleName: 'browser' }),
    minify()
  ),
];
