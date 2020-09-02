/**
 * Returns a promise that resolves successfully after the given delay.
 *
 * @param ms The delay in milliseconds.
 */
export function delay(ms: number): Promise<void>;

/**
 * Delays the resolution of `promise` by the given delay.
 *
 * @param ms The delay in milliseconds.
 * @param promise The promise to delay.
 */
export function delay<T>(ms: number, promise: Promise<T>): Promise<T>;

export async function delay(...args: unknown[]): Promise<unknown> {
  const ms = args[0];

  if (typeof ms === 'number') {
    const promise = args[1];
    const delay = new Promise(resolve => setTimeout(resolve, ms));
    if (promise != null) {
      await delay;
      return promise;
    } else {
      return delay;
    }
  } else {
    return Promise.reject(
      new TypeError('First argument to `delay` must be a number')
    );
  }
}

/**
 * Returns a promise that will reject after the given duration.
 *
 * @param ms A duration in milliseconds.
 */
export function timeout<T>(ms: number): Promise<void>;

/**
 * Assigns a timeout to the given promise, where if the promise doesn't complete
 * within the given duration an exception will be thrown.
 *
 * @param ms The timeout, in milliseconds.
 * @param promise The promise to assign a timeout to.
 */
export function timeout<T>(ms: number, promise: Promise<T>): Promise<T>;

export function timeout(...args: unknown[]): Promise<unknown> {
  const ms = args[0];

  if (typeof ms === 'number') {
    const promise = args[1];
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Promise timed out after ${ms}ms`)), ms)
    );
    if (promise != null) {
      return Promise.race([promise, timeout]);
    } else {
      return timeout;
    }
  } else {
    return Promise.reject('First argument to `timeout` must be a number');
  }
}
