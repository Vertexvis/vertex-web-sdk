import * as fs from 'fs';
import * as path from 'path';
import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import type { OutputOptions, Plugin, RollupOptions } from 'rollup';
import { terser } from 'rollup-plugin-terser';
import ts from 'typescript';

export type RollupConfig = RollupOptions;

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

interface CdnConfig {
  /**
   * The entrypoint for the generated bundle. This defaults to `src/index.ts`
   * if not specified.
   */
  entrypoint?: string;
}

interface TypeScriptPluginConfig {
  cwd?: string;
  emitDeclarations?: boolean;
}

interface OutputConfig {
  bundleName?: string;
  formats?: NonNullable<OutputOptions['format']>[];
  sourcemaps?: boolean;
  minify?: boolean;
  name?: OutputOptions['name'];
  globals?: OutputOptions['globals'];
}

type PluginContextLike = {
  error(message: string): never;
};

function createTypeScriptPlugin({
  cwd = process.cwd(),
  emitDeclarations = true,
}: TypeScriptPluginConfig = {}): Plugin {
  const tsconfigPath = ts.findConfigFile(
    cwd,
    ts.sys.fileExists,
    'tsconfig.json'
  );
  if (tsconfigPath == null) {
    throw new Error(`Unable to find a tsconfig.json in ${cwd}.`);
  }

  const parsedConfig = loadTsConfig(tsconfigPath);
  const transpileOptions: ts.CompilerOptions = {
    ...parsedConfig.options,
    declaration: false,
    declarationMap: false,
    module: ts.ModuleKind.ESNext,
    noEmit: false,
  };

  return {
    name: 'vertex-typescript',
    transform(source, id) {
      if (!isTypeScriptFile(id)) {
        return null;
      }

      const transpiled = ts.transpileModule(source, {
        compilerOptions: transpileOptions,
        fileName: id,
        reportDiagnostics: true,
      });

      reportDiagnostics(this, transpiled.diagnostics ?? []);

      return {
        code: transpiled.outputText,
        map:
          transpiled.sourceMapText != null
            ? JSON.parse(transpiled.sourceMapText)
            : null,
      };
    },
    buildEnd(error) {
      if (error != null || !emitDeclarations) {
        return;
      }

      const compilerOptions: ts.CompilerOptions = {
        ...parsedConfig.options,
        declaration: true,
        declarationMap: false,
        emitDeclarationOnly: true,
        inlineSourceMap: false,
        inlineSources: false,
        noEmit: false,
        outDir: path.resolve(cwd, 'dist'),
        skipLibCheck: true,
        sourceMap: false,
      };

      const program = ts.createProgram(parsedConfig.fileNames, compilerOptions);
      reportDiagnostics(this, ts.getPreEmitDiagnostics(program));

      const emitResult = program.emit(undefined, undefined, undefined, true);
      reportDiagnostics(this, emitResult.diagnostics);

      if (emitResult.emitSkipped) {
        this.error('TypeScript declaration emit failed.');
      }
    },
  };
}

function isTypeScriptFile(id: string): boolean {
  return /\.(ts|tsx)$/.test(id) && !id.endsWith('.d.ts');
}

function loadTsConfig(tsconfigPath: string): ts.ParsedCommandLine {
  const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
  if (configFile.error != null) {
    throw new Error(formatDiagnostics([configFile.error]));
  }

  return ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    path.dirname(tsconfigPath),
    undefined,
    tsconfigPath
  );
}

function reportDiagnostics(
  plugin: PluginContextLike,
  diagnostics: readonly ts.Diagnostic[]
): void {
  const errors = diagnostics.filter(
    (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error
  );

  if (errors.length > 0) {
    plugin.error(formatDiagnostics(errors));
  }
}

function formatDiagnostics(diagnostics: readonly ts.Diagnostic[]): string {
  return ts.formatDiagnosticsWithColorAndContext(diagnostics, {
    getCanonicalFileName: (fileName) => fileName,
    getCurrentDirectory: () => process.cwd(),
    getNewLine: () => '\n',
  });
}

function readPackageJson(cwd: string): Record<string, unknown> {
  return JSON.parse(
    fs.readFileSync(path.resolve(cwd, 'package.json'), 'utf-8')
  );
}

function createExternalModules(
  cwd: string,
  modules: Config['external']
): NonNullable<RollupConfig['external']> {
  const packageJson = readPackageJson(cwd) as {
    dependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
  };
  const dependencies = Object.keys(packageJson.dependencies ?? {});
  const peerDependencies = Object.keys(packageJson.peerDependencies ?? {});
  const configuredModules =
    modules == null || typeof modules === 'function'
      ? []
      : Array.isArray(modules)
        ? modules
        : [modules];
  const normalizedModules = [
    ...dependencies,
    ...peerDependencies,
    ...configuredModules,
  ];

  return (source, importer, isResolved) =>
    normalizedModules.some((module) => matchesExternalModule(source, module)) ||
    (typeof modules === 'function' &&
      modules(source, importer, isResolved) === true);
}

function matchesExternalModule(
  source: string,
  module: string | RegExp
): boolean {
  return typeof module === 'string'
    ? source === module || source.startsWith(`${module}/`)
    : module.test(source);
}

function createOutputs({
  bundleName = 'bundle',
  formats = ['cjs', 'esm'],
  sourcemaps = true,
  minify = false,
  name,
  globals,
}: OutputConfig = {}): OutputOptions[] {
  return formats.flatMap((format) => {
    const output: OutputOptions = {
      file: `dist/${bundleName}.${format}.js`,
      format,
      globals,
      name,
      sourcemap: sourcemaps,
    };

    return minify
      ? [
          output,
          {
            ...output,
            file: `dist/${bundleName}.${format}.min.js`,
            plugins: [terser()],
          },
        ]
      : [output];
  });
}

function createConfig({
  entrypoint = 'src/index.ts',
  externalModules,
  resolveOptions,
  outputOptions,
  emitDeclarations = true,
}: {
  entrypoint?: string;
  externalModules?: Config['external'];
  resolveOptions?: Parameters<typeof nodeResolve>[0];
  outputOptions?: OutputConfig;
  emitDeclarations?: boolean;
} = {}): RollupConfig {
  const cwd = process.cwd();

  return {
    external: createExternalModules(cwd, externalModules),
    input: entrypoint,
    output: createOutputs(outputOptions),
    plugins: [
      nodeResolve({
        extensions: ['.mjs', '.js', '.json', '.node', '.ts', '.tsx'],
        ...resolveOptions,
      }),
      commonjs(),
      createTypeScriptPlugin({ cwd, emitDeclarations }),
    ],
  };
}

export function rollupConfig({
  isMultiPlatform = false,
  external: externalModules,
}: Config = {}): RollupConfig | RollupConfig[] {
  if (!isMultiPlatform) {
    return createConfig({ externalModules });
  }

  return [
    createConfig({
      externalModules,
      resolveOptions: { exportConditions: ['node'] },
    }),
    createConfig({
      emitDeclarations: false,
      outputOptions: { bundleName: 'browser' },
      resolveOptions: { browser: true },
    }),
  ];
}

/**
 * Builds a Rollup configuration intended for use over CDN. This config
 * will result in an ESM bundle being generated and placed in the `/dist/cdn`
 * directory which does not treat peer dependencies as external.
 *
 * @param cdnConfig the configuration for generating this CDN bundle.
 */
export function rollupCdnConfig({ entrypoint }: CdnConfig = {}): RollupConfig {
  return createConfig({
    emitDeclarations: false,
    entrypoint: entrypoint ?? 'src/index.ts',
    externalModules: [],
    outputOptions: {
      bundleName: 'cdn/bundle',
      formats: ['esm'],
      minify: true,
    },
    resolveOptions: { browser: true },
  });
}
