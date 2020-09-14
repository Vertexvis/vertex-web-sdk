import { ImageLoadError } from '../errors';
import { Disposable } from '@vertexvis/utils';

export interface HtmlImage extends Disposable {
  image: HTMLImageElement | ImageBitmap;
}

function loadImageBytesAsImageElement(
  imageData: Uint8Array
): Promise<HtmlImage> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([imageData]);
    const blobUrl = URL.createObjectURL(blob);

    const image = new Image();
    image.addEventListener('load', () => {
      resolve({ image, dispose: () => undefined });
      URL.revokeObjectURL(blobUrl);
    });
    image.addEventListener('error', () => {
      reject(new ImageLoadError('Failed to load image data'));
      URL.revokeObjectURL(blobUrl);
    });

    image.src = blobUrl;
  });
}

async function loadImageBytesAsImageBitmap(
  imageData: Uint8Array
): Promise<HtmlImage> {
  const blob = new Blob([imageData]);
  const bitmap = await window.createImageBitmap(blob);
  return { image: bitmap, dispose: () => bitmap.close() };
}

export function loadImageBytes(imageBytes: Uint8Array): Promise<HtmlImage> {
  if (window.createImageBitmap != null) {
    return loadImageBytesAsImageBitmap(imageBytes);
  } else {
    return loadImageBytesAsImageElement(imageBytes);
  }
}
