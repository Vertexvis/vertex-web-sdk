import { defineWorker } from '@vertexvis/web-workers';
import { decode } from 'fast-png';

async function decodePng(bytes) {
  return decode(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes));
}

defineWorker(decodePng);
