import { defineWorker } from '@vertexvis/web-workers';
import { decode, IDecodedPNG } from 'fast-png';

export type DecodePngFn = (bytes: ArrayBufferLike) => Promise<IDecodedPNG>;

const decodePng: DecodePngFn = async (bytes) => {
  return decode(bytes);
};

defineWorker(decodePng);
