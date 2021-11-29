/**
 * Adds a listener to the given `target`, and returns a promise that
 * resolves with the first event emitted of the given `type`.
 *
 * @param target The target to add an event listener to.
 * @param type The event type to listen for.
 * @param opts Options to pass to `addEventListener`.
 * @returns A promise that resolves with the first event emitted of `type`.
 */
export async function once<E extends Event>(
  target: EventTarget,
  type: string,
  opts?: boolean | AddEventListenerOptions
): Promise<E> {
  return new Promise((resolve) => {
    function handler(event: Event): void {
      target.removeEventListener(type, handler);
      resolve(event as E);
    }
    target.addEventListener(type, handler, opts);
  });
}
