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
  isMultiPlatform = false,
  globalName,
}: Config = {}): RollupConfig | RollupConfig[] {
  if (!isMultiPlatform) {
    return withCdnDistribution(
      config(input('src/index.ts'), typescript(), output(), minify()),
      globalName
    );
  } else {
    return [
      config(
        input('src/index.ts'),
        commonJs({ commonjs: { namedExports: { uuid: ['v1'] } } }),
        typescript(),
        output(),
        minify()
      ),
      ...withCdnDistribution(
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
    const cdnConfig = minify()(
      output({
        formats: ['umd', 'esm'],
        name: globalName,
        bundleName: 'cdn/bundle',
        ...options,
      })(baseConfig)
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

  return [external('tslib')(baseConfig)];
}
