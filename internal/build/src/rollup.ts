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
