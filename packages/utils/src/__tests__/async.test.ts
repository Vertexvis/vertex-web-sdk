import { abort, delay, retry, timeout } from '../async';

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

describe(retry, () => {
  it('returns result if no error', async () => {
    expect(await retry(() => Promise.resolve(1))).toEqual(1);
  });

  it('retries and returns successful result', async () => {
    let count = 0;
    const process = async (): Promise<number> => {
      count = count + 1;
      if (count === 1) {
        throw new Error('Failure');
      } else {
        return 1;
      }
    };

    expect(await retry(process, { maxRetries: 1 })).toEqual(1);
  });

  it('rethrows error after max retries', async () => {
    const error = new Error('Failure');
    const process = jest.fn().mockRejectedValue(error);

    await expect(retry(process, { maxRetries: 2 })).rejects.toThrow(error);
    expect(process).toHaveBeenCalledTimes(3);
  });

  it('delays retries', async () => {
    const error = new Error('Failure');
    const process = jest.fn().mockRejectedValue(error);

    retry(process, { delaysInMs: [10], maxRetries: 2 }).catch(() => undefined);

    await delay(5);
    expect(process).toHaveBeenCalledTimes(1);

    await delay(10);
    expect(process).toHaveBeenCalledTimes(2);

    await delay(10);
    expect(process).toHaveBeenCalledTimes(3);
  });
});

describe(abort, () => {
  it('resolves with result if completed before abort signal', async () => {
    const controller = new AbortController();
    const result = await abort(controller.signal, Promise.resolve(1));
    expect(result).toMatchObject({ result: 1 });
  });

  it('resolves with abort result if aborted', async () => {
    const controller = new AbortController();
    const pendingResult = abort(
      controller.signal,
      delay(10, Promise.resolve(1))
    );
    controller.abort();
    await expect(pendingResult).resolves.toMatchObject({ aborted: true });
  });
});
