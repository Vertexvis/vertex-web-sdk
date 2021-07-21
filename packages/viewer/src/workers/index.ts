export function loadDecodePngWorker(): Promise<
  typeof import('./png-decoder.worker')
> {
  return loadWorker(() => import('./png-decoder.worker'));
}

/**
 * Checks if the code is running in a browser environment, and if so calls
 * `module()` which is expected to load a module via a dynamic import.
 *
 * @example
 *
 * ```ts
 * // module.ts
 * export function hi(): string {
 *   return 'hi';
 * }
 *
 * // loader.ts
 * async function main(): Promise<void> {
 *   const { hi } = await loadWorker(() => import('./module'));
 * 	 console.log(hi()); // hi
 * }
 * ```
 *
 * @param module A function that will load the module via dynamic imports.
 * @returns A promise that resolves with the loaded module.
 */
async function loadWorker<T>(module: () => Promise<T>): Promise<T> {
  if (isBrowserEnv()) {
    return await module();
  } else {
    throw new Error('Worker is not supported in non-browser environments.');
  }
}

function isBrowserEnv(): boolean {
  return typeof window !== 'undefined';
}
