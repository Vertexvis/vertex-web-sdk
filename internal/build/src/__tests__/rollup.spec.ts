import { rollupCdnConfig, rollupConfig } from '../rollup';

describe(rollupConfig, () => {
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
});

describe(rollupCdnConfig, () => {
  it('should generate an esm bundle', () => {
    const config = rollupCdnConfig({});
    expect(config).toMatchObject(
      expect.objectContaining({
        output: expect.arrayContaining([
          expect.objectContaining({ format: 'esm' }),
        ]),
      })
    );
  });
});
