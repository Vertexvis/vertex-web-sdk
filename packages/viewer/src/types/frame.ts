import { Dimensions, Vector3, Rectangle } from '@vertexvis/geometry';
import { vertexvis } from '@vertexvis/frame-streaming-protos';
import * as FrameCamera from './frameCamera';

export interface Frame {
  correlationIds: string[];
  imageAttributes: ImageAttributes;
  sceneAttributes: SceneAttributes;
  sequenceNumber: number;
  image: Uint8Array;
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
  payload: vertexvis.protobuf.stream.IDrawFramePayload
): Frame => {
  const {
    frameCorrelationIds,
    imageAttributes,
    sceneAttributes,
    sequenceNumber,
    image,
  } = payload;
  if (
    imageAttributes == null ||
    imageAttributes.frameDimensions == null ||
    imageAttributes.imageRect == null ||
    sceneAttributes == null ||
    sceneAttributes.camera == null
  ) {
    throw new Error('Invalid payload');
  }

  return {
    correlationIds: frameCorrelationIds || [],
    imageAttributes: {
      frameDimensions: Dimensions.create(
        imageAttributes.frameDimensions.width!,
        imageAttributes.frameDimensions.height!
      ),
      imageRect: Rectangle.create(
        imageAttributes.imageRect.x!,
        imageAttributes.imageRect.y!,
        imageAttributes.imageRect.width!,
        imageAttributes.imageRect.height!
      ),
      scaleFactor: imageAttributes.scaleFactor!,
    },
    sceneAttributes: {
      camera: FrameCamera.create({
        //@ts-ignore
        position: Vector3.create(sceneAttributes.camera.position),
        //@ts-ignore
        lookAt: Vector3.create(sceneAttributes.camera.lookAt!),
        //@ts-ignore
        up: Vector3.create(sceneAttributes.camera.up!),
      }),
    },
    sequenceNumber: sequenceNumber!,
    image: image!,
  };
};
