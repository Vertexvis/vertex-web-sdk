import { defineWorker } from '@vertexvis/web-workers';
import { decode } from 'fast-png';

async function decodePng(bytes) {
  return decode(bytes);
}

defineWorker(decodePng);
