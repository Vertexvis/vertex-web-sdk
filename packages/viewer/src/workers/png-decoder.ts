import { defineWorker } from '@vertexvis/web-workers';
import { decode, DecodedPng } from 'fast-png';

export type DecodePngFn = (bytes: ArrayBufferLike) => Promise<DecodedPng>;

const decodePng: DecodePngFn = async (bytes) => {
  return decode(bytes);
};

defineWorker(decodePng);
