import { defineWorker } from '@vertexvis/web-workers';
import type { DecodedPng } from 'fast-png';
import { decode } from 'fast-png';

export type DecodePngBytes = ArrayBufferLike | Uint8Array<ArrayBufferLike>;

export type DecodePngFn = (bytes: DecodePngBytes) => Promise<DecodedPng>;

async function decodePng(bytes: DecodePngBytes): Promise<DecodedPng> {
  return decode(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes));
}

defineWorker(decodePng);
