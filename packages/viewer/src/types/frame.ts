import { Dimensions, Vector3, Rectangle } from '@vertexvis/geometry';
import { vertexvis } from '@vertexvis/frame-streaming-protos';
import * as FrameCamera from './frameCamera';

export interface Frame {
  correlationIds: string[];
  imageAttributes: ImageAttributes;
  sceneAttributes: SceneAttributes;
  sequenceNumber: number;
}

export interface ImageAttributes {
  frameDimensions: Dimensions.Dimensions;
  imageRect: Rectangle.Rectangle;
  scaleFactor: number;
}

export interface SceneAttributes {
  camera: FrameCamera.FrameCamera;
}

export const fromProto = (
  frameResult: vertexvis.protobuf.stream.IFrameResult
): Frame => {
  const {
    frameCorrelationIds,
    imageAttributes,
    sceneAttributes,
    sequenceNumber,
  } = frameResult;

  return {
    correlationIds: frameCorrelationIds || [],
    imageAttributes: {
      frameDimensions: Dimensions.create(
        imageAttributes.frameDimensions.width,
        imageAttributes.frameDimensions.height
      ),
      imageRect: Rectangle.create(
        imageAttributes.imageRect.x,
        imageAttributes.imageRect.y,
        imageAttributes.imageRect.width,
        imageAttributes.imageRect.height
      ),
      scaleFactor: imageAttributes.scaleFactor,
    },
    sceneAttributes: {
      camera: FrameCamera.create({
        position: Vector3.create(sceneAttributes.camera.position),
        lookAt: Vector3.create(sceneAttributes.camera.lookAt),
        up: Vector3.create(sceneAttributes.camera.up),
      }),
    },
    sequenceNumber,
  };
};
