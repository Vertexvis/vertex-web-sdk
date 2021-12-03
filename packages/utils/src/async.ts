import { once } from './eventTargets';

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
    const delay = new Promise((resolve) => setTimeout(resolve, ms));
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
export function timeout(ms: number): Promise<void>;

/**
 * Assigns a timeout to the given promise, where if the promise doesn't complete
 * within the given duration an exception will be thrown.
 *
 * @param ms The timeout, in milliseconds.
 * @param promise The promise to assign a timeout to.
 */
export function timeout<T>(ms: number, promise: Promise<T>): Promise<T>;

export async function timeout(...args: unknown[]): Promise<unknown> {
  const ms = args[0];

  if (typeof ms === 'number') {
    const promise = args[1];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let timer: any;
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(
        () => reject(new Error(`Promise timed out after ${ms}ms`)),
        ms
      );
    });
    if (promise != null) {
      const res = await Promise.race([promise, timeout]);
      clearTimeout(timer);
      return res;
    } else {
      return timeout;
    }
  } else {
    return Promise.reject('First argument to `timeout` must be a number');
  }
}

interface RetryOptions {
  delaysInMs?: number[];
  maxRetries?: number;
  abort?: AbortController;
}

/**
 * Executes and reattempts execution of an asynchronous function if it throws an
 * error. By default, this function will only retry once and reexecute
 * immediately after the previous execution throws. You can configure the number
 * of retry attempts and delays with the `maxRetries` and `delaysInMs` options.
 *
 * The `delaysInMs` is an array of delays in milliseconds for each retry
 * attempt. If there are more retry attempts than delays, the last delay will be
 * used.
 *
 * @param process The process to execute.
 * @param opts Options to configure retry behavior.
 * @returns A promise that resolves with a successful value, or the original
 *  rejected value if the process fails.
 */
export async function retry<T>(
  process: () => Promise<T>,
  opts: RetryOptions = {}
): Promise<T> {
  async function execute<T>(
    attempt: number,
    process: () => Promise<T>,
    opts: RetryOptions
  ): Promise<T> {
    const { delaysInMs = [], maxRetries = 1 } = opts;

    try {
      const delayInMs =
        attempt === 0 || delaysInMs.length === 0
          ? 0
          : delaysInMs[Math.min(attempt - 1, delaysInMs.length - 1)];
      await delay(delayInMs);
      return await process();
    } catch (e) {
      if (attempt < maxRetries) {
        return await execute(attempt + 1, process, opts);
      } else throw e;
    }
  }

  return execute(0, process, opts);
}

/**
 * Returns a promise that either resolves with the result of `promise`, or a
 * value that indicates the execution was aborted.
 *
 * **Note:** Because Promises in JS cannot be canceled, an abort signal will not
 * cancel the execution of the promise.
 *
 * @param signal A signal that communicates the process should be aborted.
 * @param promise A promise who's value will be returned if not aborted.
 * @returns A value indicating if the process was aborted, or the value of
 * `promise`.
 */
export async function abort<T>(
  signal: AbortSignal,
  promise: Promise<T>
): Promise<{ aborted: true } | { aborted: false; result: T }> {
  const controller = new AbortController();
  const pendingAbort = once(signal, 'abort', { signal: controller.signal });
  const result = await Promise.race([promise, pendingAbort]);

  if (isAbortEvent(result)) {
    return { aborted: true };
  } else {
    controller.abort();
    return { aborted: false, result };
  }
}

function isAbortEvent(obj: unknown): obj is Event {
  if (obj instanceof Event) {
    return obj.type === 'abort';
  } else return false;
}
