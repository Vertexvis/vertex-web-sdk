import * as Frame from '../frame';
import * as FrameCamera from '../frameCamera';
import { Dimensions, Rectangle } from '@vertexvis/geometry';

export const frame: Frame.Frame = {
  correlationIds: [],
  imageAttributes: {
    frameDimensions: Dimensions.create(100, 50),
    imageRect: Rectangle.create(0, 0, 100, 50),
    scaleFactor: 1,
  },
  sceneAttributes: { camera: FrameCamera.create() },
  sequenceNumber: 1,
};
