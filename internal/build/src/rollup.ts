import {
  config,
  commonJs,
  typescript,
  minify,
  output,
  input,
  external,
  RollupConfig,
  autoExternal,
} from '@vertexvis/build-tools';

interface Config {
  /**
   * Indicates if the generated config will output both Node and browser
   * bundles. This is useful for library projects that need to support both
   * environments.
   */
  isMultiPlatform?: boolean;
}

export function rollupConfig({ isMultiPlatform = false }: Config = {}):
  | RollupConfig
  | RollupConfig[] {
  if (!isMultiPlatform) {
    return config(
      input('src/index.ts'),
      external('tslib'),
      typescript(),
      output(),
      minify()
    );
  } else {
    return [
      config(
        input('src/index.ts'),
        commonJs({ commonjs: { namedExports: { uuid: ['v1'] } } }),
        external('tslib'),
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
        external('tslib'),
        typescript(),
        output({ bundleName: 'browser' }),
        minify()
      ),
    ];
  }
}

interface CdnConfig {
  /**
   * The entrypoint for the generated bundle. This defaults to `src/index.ts`
   * if not specified.
   */
  entrypoint?: string;
}

/**
 * Builds a Rollup configuration intended for use over CDN. This config
 * will result in an ESM bundle being generated and placed in the `/dist/cdn`
 * directory which does not treat peer dependencies as external.
 *
 * @param cdnConfig the configuration for generating this CDN bundle.
 */
export function rollupCdnConfig({ entrypoint }: CdnConfig = {}): RollupConfig {
  return config(
    input(entrypoint || 'src/index.ts'),
    autoExternal({
      peerDependencies: false,
    }),
    typescript(),
    commonJs({ nodeResolve: { browser: true } }),
    output({
      formats: ['esm'],
      bundleName: 'cdn/bundle',
    }),
    minify()
  );
}
