import type { DecodePngFn } from '../png-decoder';

export const decodePng: DecodePngFn = async () => {
  return {
    channels: 1,
    data: new Uint16Array(),
    depth: 16,
    height: 0,
    width: 0,
    text: {},
  };
};
