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

  /**
   * Indicates if the generated config will output both Node and browser
   * bundles. This is useful for library projects that need to support both
   * environments.
   */
  isMultiPlatform?: boolean;
}

export function rollupConfig({
  entrypoint,
  globalName,
  isMultiPlatform = false,
}: Config = {}): RollupConfig | RollupConfig[] {
  if (!isMultiPlatform) {
    console.log(
      config(
        input(entrypoint || 'src/index.ts'),
        typescript(),
        external('tslib'),
        output(),
        minify()
      )
    );
    return withCdnDistribution(
      config(
        input(entrypoint || 'src/index.ts'),
        typescript(),
        output(),
        minify()
      ),
      globalName
    );
  } else {
    return [
      config(
        input(entrypoint || 'src/index.ts'),
        commonJs({ commonjs: { namedExports: { uuid: ['v1'] } } }),
        typescript(),
        output(),
        minify()
      ),
      ...withCdnDistribution(
        config(
          input(entrypoint || 'src/index.ts'),
          commonJs({
            commonjs: { namedExports: { uuid: ['v1'] } },
            nodeResolve: { browser: true },
          }),
          typescript(),
          output({ bundleName: 'browser' }),
          minify()
        ),
        globalName,
        { bundleName: 'browser' }
      ),
    ];
  }
}

function withCdnDistribution(
  baseConfig: RollupConfig,
  globalName?: string,
  options?: Record<string, string>
): RollupConfig[] {
  if (globalName != null) {
    const cdnConfig = config(
      () => ({ ...baseConfig, plugins: [] }),
      commonJs({ nodeResolve: { browser: true } }),
      output({
        formats: ['umd', 'esm'],
        name: globalName,
        bundleName: 'cdn/bundle',
        ...options,
      }),
      minify()
    );

    return [
      {
        ...baseConfig,
        ...cdnConfig,
        plugins: [...(baseConfig.plugins || []), ...(cdnConfig.plugins || [])],
      },
      baseConfig,
    ];
  }

  return [config(() => baseConfig, external('tslib'))];
}
