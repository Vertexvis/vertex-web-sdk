import fs from 'fs';
import { builtinModules } from 'module';
import path from 'path';
import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import ts from 'typescript';

function loadTsConfig(tsconfigPath) {
  const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
  if (configFile.error != null) {
    throw new Error(
      ts.formatDiagnosticsWithColorAndContext([configFile.error], {
        getCanonicalFileName: (fileName) => fileName,
        getCurrentDirectory: () => process.cwd(),
        getNewLine: () => '\n',
      })
    );
  }

  return ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    path.dirname(tsconfigPath),
    undefined,
    tsconfigPath
  );
}

function createTypeScriptPlugin() {
  const parsedConfig = loadTsConfig(
    path.resolve(process.cwd(), 'tsconfig.json')
  );
  const transpileOptions = {
    ...parsedConfig.options,
    declaration: false,
    declarationMap: false,
    module: ts.ModuleKind.ESNext,
    noEmit: false,
  };

  return {
    name: 'vertex-typescript',
    transform(source, id) {
      if (!/\.(ts|tsx)$/.test(id) || id.endsWith('.d.ts')) {
        return null;
      }

      const transpiled = ts.transpileModule(source, {
        compilerOptions: transpileOptions,
        fileName: id,
        reportDiagnostics: true,
      });

      const errors = (transpiled.diagnostics ?? []).filter(
        (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error
      );
      if (errors.length > 0) {
        this.error(
          ts.formatDiagnosticsWithColorAndContext(errors, {
            getCanonicalFileName: (fileName) => fileName,
            getCurrentDirectory: () => process.cwd(),
            getNewLine: () => '\n',
          })
        );
      }

      return {
        code: transpiled.outputText,
        map:
          transpiled.sourceMapText != null
            ? JSON.parse(transpiled.sourceMapText)
            : null,
      };
    },
  };
}

const packageJson = JSON.parse(
  fs.readFileSync(new URL('./package.json', import.meta.url), 'utf8')
);
const builtins = builtinModules.flatMap((module) => [module, `node:${module}`]);

export default {
  external: [
    ...builtins,
    ...Object.keys(packageJson.dependencies ?? {}),
    ...Object.keys(packageJson.peerDependencies ?? {}),
  ],
  input: 'src/index.ts',
  output: [
    { file: 'dist/bundle.cjs.js', format: 'cjs', sourcemap: true },
    { file: 'dist/bundle.esm.js', format: 'esm', sourcemap: true },
  ],
  plugins: [
    nodeResolve({
      extensions: ['.mjs', '.js', '.json', '.node', '.ts', '.tsx'],
    }),
    commonjs(),
    createTypeScriptPlugin(),
  ],
};
