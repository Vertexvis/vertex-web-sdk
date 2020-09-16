import { delay, timeout } from '../async';

describe(delay, () => {
  it('returns a promise that resolves after given delay', async () => {
    await delay(10);
  });

  it('delays resolution of promise by given duration', async () => {
    const result = await delay(10, Promise.resolve(1));
    expect(result).toBe(1);
  });
});

describe(timeout, () => {
  it('rejects after given duration', async () => {
    await expect(timeout(10)).rejects.toThrow();
  });

  it('rejects promise if not completed within timeout', async () => {
    const result = timeout(10, delay(20, Promise.resolve()));
    await expect(result).rejects.toThrow();
  });

  it('resolves promise if completed within timeout', async () => {
    const result = timeout(50, delay(10, Promise.resolve(1)));
    expect(await result).toBe(1);
  });
});
