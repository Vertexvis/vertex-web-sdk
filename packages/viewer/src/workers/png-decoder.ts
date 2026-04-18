import type { DecodedPng } from 'fast-png';

export type DecodePngFn = (bytes: ArrayBufferLike) => Promise<DecodedPng>;
