import { Async } from '@vertexvis/utils';

/**
 * Runs a function that contains assertions until they pass, or until the number
 * of attempts are exhausted. This helper is handy for async operations where
 * you are not able to know if they've completed or not.
 *
 * @example
 *
 * test('it works', async () => {
 *   await eventually(() => expect(1 + 1).toEqual(2));
 * })
 */
export async function eventually(
  assertions: () => void | Promise<void>,
  { attempts = 50, delay = 20 }: { attempts?: number; delay?: number } = {}
): Promise<void> {
  let error: unknown | undefined = undefined;

  for (let i = 0; i < attempts; i++) {
    try {
      await assertions();
      error = null;
      break;
    } catch (e) {
      error = e;
      await Async.delay(delay);
    }
  }

  if (error != null) {
    throw error;
  }
}
