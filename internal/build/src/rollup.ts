import {
  config,
  commonJs,
  typescript,
  minify,
  output,
  input,
  external,
  RollupConfig,
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

  /**
   * Indicates the UMD global name where this package's exports will be made
   * available.
   */
  globalName: string;
}

/**
 * Builds a Rollup configuration intended for use over CDN. This config
 * will result in a UMD bundle being generated and placed in the `/dist/cdn`
 * directory.
 *
 * @param cdnConfig the configuration for generating this CDN bundle.
 */
export function rollupCdnConfig({
  entrypoint,
  globalName,
}: CdnConfig): RollupConfig {
  return config(
    input(entrypoint || 'src/index.ts'),
    typescript(),
    commonJs({ nodeResolve: { browser: true } }),
    output({
      formats: ['umd'],
      name: globalName,
      bundleName: 'cdn/bundle',
    }),
    minify()
  );
}
