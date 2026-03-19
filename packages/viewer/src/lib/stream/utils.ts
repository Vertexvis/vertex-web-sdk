import { Async } from '@vertexvis/utils';

export function retryIfNotAborted<T>(
  abortSignal: AbortSignal,
  fn: () => Promise<T>,
  fallback: T,
  opts: Async.RetryOptions
): Promise<T> {
  return Async.retry<T>((): Promise<T> => {
    if (!abortSignal.aborted) {
      return fn();
    }

    // Intentionally return a resolved fallback promise if the AbortSignal
    // associated to this attempt has been aborted to avoid attempts
    // to rerun the function after another process has aborted this one.
    return Promise.resolve(fallback);
  }, opts);
}
