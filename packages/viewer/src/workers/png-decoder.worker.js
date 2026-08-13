import { decode } from 'fast-png';

self.addEventListener('message', async (event) => {
  try {
    const bytes = event.data;
    const result = decode(
      bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes),
    );
    self.postMessage({ result });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    self.postMessage({ error: message });
  }
});
