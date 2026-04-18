import type { DecodedPng } from 'fast-png';

export type DecodePngBytes = ArrayBufferLike | Uint8Array<ArrayBufferLike>;

export type DecodePngFn = (bytes: DecodePngBytes) => Promise<DecodedPng>;
