import type { DecodedPng } from 'fast-png';
import { decode } from 'fast-png';
import { expose } from 'threadsx/worker';

export type DecodePngBytes = ArrayBufferLike | Uint8Array<ArrayBufferLike>;

export type DecodePngFn = (bytes: DecodePngBytes) => Promise<DecodedPng>;

async function decodePng(bytes: DecodePngBytes): Promise<DecodedPng> {
  return decode(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes));
}

expose(decodePng);
