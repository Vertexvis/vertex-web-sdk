import {
  config,
  typescript,
  output,
  input,
  external,
  RollupConfig,
  resolve,
} from '@vertexvis/build-tools';

interface Config {
  /**
   * Indicates if the generated config will output both Node and browser
   * bundles. This is useful for library projects that need to support both
   * environments.
   */
  isMultiPlatform?: boolean;

  /**
   * Any modules that you want to keep external.
   */
  external?: RollupConfig['external'];
}

export function rollupConfig({
  isMultiPlatform = false,
  external: externalModules,
}: Config = {}): RollupConfig | RollupConfig[] {
  if (!isMultiPlatform) {
    return config(
      input('src/index.ts'),
      resolve(),
      external({ peerDependencies: true, modules: externalModules }),
      typescript(),
      output()
    );
  } else {
    return [
      config(
        input('src/index.ts'),
        resolve({ resolve: { exportConditions: ['node'] } }),
        external({ peerDependencies: true, modules: externalModules }),
        typescript(),
        output()
      ),
      config(
        input('src/index.ts'),
        resolve({ resolve: { browser: true } }),
        external({ peerDependencies: true }),
        typescript(),
        output({ bundleName: 'browser' })
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
    external({ peerDependencies: false, dependencies: false }),
    typescript(),
    resolve({ resolve: { browser: true } }),
    output({
      formats: ['esm'],
      bundleName: 'cdn/bundle',
      minify: true,
    })
  );
}
