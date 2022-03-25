import { Dimensions, Point, Rectangle, Vector3 } from '@vertexvis/geometry';
import { DrawFramePayload } from '@vertexvis/stream-api';
import { Color, Mapper } from '@vertexvis/utils';
import { encode } from 'fast-png';

import { PointToPointHitTester } from '../components/viewer-measurement-distance/hitTest';
import { PointToPointHitProvider } from '../components/viewer-measurement-distance/interactions';
import { fromPbFrame } from '../lib/mappers';
import { RaycasterLike } from '../lib/scenes/raycaster';
import {
  DepthBuffer,
  FeatureMap,
  Frame,
  FrameCameraBase,
  ImageAttributesLike,
  Orientation,
  STENCIL_BUFFER_FEATURE_VALUE,
  StencilBuffer,
  Viewport,
} from '../lib/types';

const baseDrawFramePayload: Partial<DrawFramePayload> = {
  sequenceNumber: 1,
  sceneAttributes: {
    visibleBoundingBox: {
      xmin: -100,
      ymin: -100,
      zmin: -100,
      xmax: 100,
      ymax: 100,
      zmax: 100,
    },
    crossSectioning: {
      sectionPlanes: [{ normal: { x: 0, y: 0, z: 0 }, offset: 0 }],
    },
    hasChanged: false,
  },
  imageAttributes: {
    frameDimensions: { width: 100, height: 50 },
    imageRect: { x: 0, y: 0, width: 100, height: 50 },
    scaleFactor: 1,
  },
  frameCorrelationIds: ['123'],
  image: makeImagePng(100, 50),
  depthBuffer: { value: makeDepthImagePng(100, 50) },
};

export const drawFramePayloadPerspective: DrawFramePayload = {
  ...baseDrawFramePayload,
  sceneAttributes: {
    ...baseDrawFramePayload.sceneAttributes,
    camera: {
      perspective: {
        position: { x: 0, y: 0, z: 100 },
        lookAt: { x: 0, y: 0, z: 0 },
        up: { x: 0, y: 1, z: 0 },
      },
    },
  },
};

export const drawFramePayloadOrthographic: DrawFramePayload = {
  ...baseDrawFramePayload,
  sceneAttributes: {
    ...baseDrawFramePayload.sceneAttributes,
    camera: {
      orthographic: {
        viewVector: { x: 0, y: 0, z: -100 },
        lookAt: { x: 0, y: 0, z: 0 },
        up: { x: 0, y: 1, z: 0 },
        fovHeight: 100,
      },
    },
  },
};

export function makePerspectiveFrame(): Frame {
  return Mapper.ifInvalidThrow(fromPbFrame(Orientation.DEFAULT))(
    drawFramePayloadPerspective
  );
}

export function makeOrthographicFrame(): Frame {
  return Mapper.ifInvalidThrow(fromPbFrame(Orientation.DEFAULT))(
    drawFramePayloadOrthographic
  );
}

export function makeImagePng(width: number, height: number): Uint8Array {
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

export function makeDepthImagePng(
  width: number,
  height: number,
  value = 2 ** 16 - 1
): Uint8Array {
  const bytes = makeDepthImageBytes(width, height, value);
  return encode({ width, height, data: bytes, depth: 16, channels: 1 });
}

export function makeDepthImageBytes(
  width: number,
  height: number,
  value = 2 ** 16 - 1
): Uint16Array {
  const data = new Uint16Array(width * height);
  return data.fill(value);
}

export function makeDepthBuffer(
  width: number,
  height: number,
  value = 2 ** 16 - 1,
  camera?: FrameCameraBase
): DepthBuffer {
  return DepthBuffer.fromPng(
    { data: makeDepthImageBytes(width, height, value) },
    camera ?? makePerspectiveFrame().scene.camera,
    makeImageAttributes(width, height)
  );
}

export function makeStencilImageBytes(
  width: number,
  height: number,
  fill: (pixel: Point.Point) => number
): Uint8Array {
  const data = new Uint8Array(width * height * 3);
  for (let i = 0; i < width * height; i++) {
    const x = i % width;
    const y = Math.floor(i / width);
    data[i] = fill(Point.create(x, y));
  }
  return data;
}

export function makeStencilBuffer(
  width: number,
  height: number,
  fill: (pixel: Point.Point) => number,
  depthBuffer?: DepthBuffer
): StencilBuffer {
  const data = makeStencilImageBytes(width, height, fill);
  return StencilBuffer.fromPng(
    { data, channels: 1 },
    makeImageAttributes(width, height),
    data,
    depthBuffer ?? makeDepthBuffer(width, height)
  );
}

export function makeFeatureMap(
  width: number,
  height: number,
  fill: (pixel: Point.Point) => Color.Color
): FeatureMap {
  return FeatureMap.fromPng(
    {
      data: makeFeatureMapBytes(width, height, fill),
      width,
      height,
      channels: 4,
    },
    makeImageAttributes(width, height)
  );
}

export function makeFeatureMapBytes(
  width: number,
  height: number,
  fill: (pixel: Point.Point) => Color.Color
): Uint8Array {
  const data = new Uint8Array(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const x = i % width;
    const y = Math.floor(i / width);
    const color = fill(Point.create(x, y));

    const offset = i * 4;
    data[offset] = color.r;
    data[offset + 1] = color.g;
    data[offset + 2] = color.b;
    data[offset + 3] = color.a;
  }
  return data;
}

export function makeImageAttributes(
  width: number,
  height: number
): ImageAttributesLike {
  return {
    frameDimensions: Dimensions.create(width, height),
    imageRect: Rectangle.create(0, 0, width, height),
    imageScale: 1,
  };
}

export function makeHitTester({
  stencilBuffer,
  depthBuffer,
  viewport,
  camera,
}: {
  stencilBuffer?: StencilBuffer;
  depthBuffer?: DepthBuffer;
  viewport?: Viewport;
  camera?: FrameCameraBase;
} = {}): PointToPointHitTester {
  return new PointToPointHitTester(
    stencilBuffer ??
      makeStencilBuffer(200, 100, () => STENCIL_BUFFER_FEATURE_VALUE),
    depthBuffer ?? makeDepthBuffer(200, 100),
    viewport ?? new Viewport(200, 100),
    camera ??
      new FrameCameraBase(
        Vector3.forward(),
        Vector3.origin(),
        Vector3.up(),
        0,
        100,
        1
      )
  );
}

export function makeRaycaster(): RaycasterLike {
  return { hitItems: jest.fn().mockResolvedValue({ hits: [] }) };
}

export function makeHitProvider({
  hitTester,
  raycaster,
}: {
  hitTester?: PointToPointHitTester;
  raycaster?: RaycasterLike;
}): PointToPointHitProvider {
  const defaultHitTester = makeHitTester();
  const defaultRaycaster = makeRaycaster();

  return {
    hitTester: () => hitTester ?? defaultHitTester,
    raycaster: async () => raycaster ?? defaultRaycaster,
  };
}
