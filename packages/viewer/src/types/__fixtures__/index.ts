import * as Frame from '../frame';
import * as FrameCamera from '../frameCamera';
import {
  Dimensions,
  Rectangle,
  BoundingBox,
  Vector3,
} from '@vertexvis/geometry';

export const frame: Frame.Frame = {
  correlationIds: [],
  imageAttributes: {
    frameDimensions: Dimensions.create(100, 50),
    imageRect: Rectangle.create(0, 0, 100, 50),
    scaleFactor: 1,
  },
  sceneAttributes: {
    camera: FrameCamera.create(),
    visibleBoundingBox: BoundingBox.create(Vector3.create(), Vector3.create()),
  },
  sequenceNumber: 1,
  image: new Uint8Array(),
};
