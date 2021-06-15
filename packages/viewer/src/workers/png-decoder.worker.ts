import { decode, IDecodedPNG } from 'fast-png';

export async function decodePng(
  pngBytes: ArrayBufferLike
): Promise<IDecodedPNG> {
  return decode(pngBytes);
}
