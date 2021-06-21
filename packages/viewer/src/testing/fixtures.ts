import { DrawFramePayload } from '@vertexvis/stream-api';
import { Mapper } from '@vertexvis/utils';
import { encode } from 'fast-png';
import { mapFrame } from '../lib/mappers';
import { Orientation } from '../lib/types';

const def: DrawFramePayload = {
  sequenceNumber: 1,
  sceneAttributes: {
    camera: {
      position: { x: 0, y: 0, z: 1 },
      lookAt: { x: 0, y: 0, z: 0 },
      up: { x: 0, y: 1, z: 0 },
    },
    visibleBoundingBox: {
      xmin: -1,
      ymin: -1,
      zmin: -1,
      xmax: 1,
      ymax: 1,
      zmax: 1,
    },
    crossSectioning: {
      sectionPlanes: [{ normal: { x: 0, y: 0, z: 0 }, offset: 0 }],
    },
  },
  imageAttributes: {
    frameDimensions: { width: 100, height: 50 },
    imageRect: { x: 0, y: 0, width: 100, height: 50 },
    scaleFactor: 1,
  },
  frameCorrelationIds: ['123'],
  image: createImagePng(100, 50),
  depthBuffer: { value: createDepthImagePng(100, 50) },
};

export const frame = Mapper.ifInvalidThrow(mapFrame(Orientation.DEFAULT))(def);

export function createImagePng(width: number, height: number): Uint8Array {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y + x;
      data[i + 0] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
      data[i + 3] = 255;
    }
  }
  return encode({ width, height, data, depth: 8, channels: 4 });
}

export function createDepthImagePng(
  width: number,
  height: number,
  value = 2 ** 16 - 1
): Uint8Array {
  const bytes = createDepthImageBytes(width, height, value);
  return encode({ width, height, data: bytes, depth: 16, channels: 1 });
}

export function createDepthImageBytes(
  width: number,
  height: number,
  value = 2 ** 16 - 1
): Uint16Array {
  const data = new Uint16Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y + x;
      data[i] = value;
    }
  }
  return data;
}
