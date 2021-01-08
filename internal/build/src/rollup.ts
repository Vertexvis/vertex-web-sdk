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
   * Indicates that this module is intended for CDN usage, and what global name
   * the module should be available under. Setting this name will generate a
   * UMD and ESM bundle in the /dist/cdn directory.
   */
  globalName?: string;
}

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
      bundleName: 'cdn/bundle'
    }),
    minify()
  );
}
