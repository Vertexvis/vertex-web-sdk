import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { rollup, type RollupOptions } from 'rollup';

import { rollupCdnConfig, rollupConfig } from '../rollup';

describe('rollupConfig', () => {
  it('should generate single bundle if not multiplatform', () => {
    const config = rollupConfig({ isMultiPlatform: false });
    expect(config).toMatchObject({});
  });

  it('should default to single bundle', () => {
    const config = rollupConfig();
    expect(config).toMatchObject({});
  });

  it('should generate browser and node bundles if isMultiPlatform', () => {
    const config = rollupConfig({ isMultiPlatform: true });
    expect(config).toHaveLength(2);
  });

  it('emits declarations at the package types entrypoint', async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), 'vertex-build-'));
    try {
      await mkdir(path.join(cwd, 'src'));
      await writeFile(path.join(cwd, 'package.json'), '{"name":"fixture"}');
      await writeFile(
        path.join(cwd, 'tsconfig.json'),
        JSON.stringify({
          compilerOptions: { module: 'ESNext', target: 'ES2020' },
          include: ['src', 'vitest.config.ts'],
        }),
      );
      await writeFile(
        path.join(cwd, 'src/index.ts'),
        'export const value: string = "ok";',
      );
      await writeFile(path.join(cwd, 'vitest.config.ts'), 'export {};');

      const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(cwd);
      const config = rollupConfig() as RollupOptions;
      cwdSpy.mockRestore();
      config.input = path.join(cwd, 'src/index.ts');

      const bundle = await rollup(config);
      await bundle.close();

      expect(await readFile(path.join(cwd, 'dist/index.d.ts'), 'utf8')).toContain(
        'value',
      );
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  });
});

describe('rollupCdnConfig', () => {
  it('should generate an esm bundle', () => {
    const config = rollupCdnConfig({});
    expect(config).toMatchObject(
      expect.objectContaining({
        output: expect.arrayContaining([
          expect.objectContaining({ format: 'esm' }),
        ]),
      }),
    );
  });
});
