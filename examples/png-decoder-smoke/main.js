import 'threadsx/register';

import { spawn, Thread } from 'threadsx';

const logoUrl = new URL('./vertex-logo.png', import.meta.url);
const workerUrl = new URL(
  '../../packages/viewer/dist/viewer/png-decoder.worker.js',
  import.meta.url,
);
const result = document.querySelector('#result');

try {
  const response = await fetch(logoUrl);
  if (!response.ok) {
    throw new Error(`Could not load Vertex logo: ${response.status}`);
  }

  const pngBytes = new Uint8Array(await response.arrayBuffer());
  const decodePng = await spawn(new Worker(workerUrl));
  const decoded = await decodePng(pngBytes);
  await Thread.terminate(decodePng);

  if (decoded.width !== 512 || decoded.height !== 512) {
    throw new Error(
      `Unexpected decoded dimensions: ${decoded.width} × ${decoded.height}`,
    );
  }

  result.textContent =
    'Passed: worker started and decoded the 512 × 512 Vertex logo.';
  result.dataset.status = 'passed';
} catch (error) {
  result.textContent = `Failed: ${error instanceof Error ? error.message : String(error)}`;
  result.dataset.status = 'failed';
  console.error(error);
}
