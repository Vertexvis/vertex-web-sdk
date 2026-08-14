import { decode } from 'fast-png';

// NOSONAR: Dedicated worker messages can only be sent by its owner.
self.addEventListener('message', async (event) => {
  try {
    const bytes = event.data;
    const result = decode(
      bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes),
    );
    self.postMessage({ result }, [result.data.buffer]);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    self.postMessage({ error: message });
  }
});
