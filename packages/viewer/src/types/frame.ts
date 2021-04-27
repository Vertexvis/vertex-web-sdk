import {
  Dimensions,
  Vector3,
  Rectangle,
  BoundingBox,
} from '@vertexvis/geometry';
import { vertexvis } from '@vertexvis/frame-streaming-protos';
import * as FrameCamera from './frameCamera';
import * as CrossSectioning from './crossSectioning';

export interface Frame {
  correlationIds: string[];
  imageAttributes: ImageAttributes;
  sceneAttributes: SceneAttributes;
  sequenceNumber: number;
  image: Uint8Array;
  depthBuffer?: Uint8Array;
}

export interface ImageAttributes {
  frameDimensions: Dimensions.Dimensions;
  imageRect: Rectangle.Rectangle;
  scaleFactor: number;
}

export interface SceneAttributes {
  camera: FrameCamera.FrameCamera;
  visibleBoundingBox: BoundingBox.BoundingBox;
  crossSectioning: CrossSectioning.CrossSectioning;
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
    depthBuffer,
  } = payload;
  if (
    imageAttributes == null ||
    imageAttributes.frameDimensions == null ||
    imageAttributes.imageRect == null ||
    sceneAttributes == null ||
    sceneAttributes.camera == null ||
    imageAttributes.frameDimensions.width == null ||
    imageAttributes.frameDimensions.height == null ||
    imageAttributes.imageRect.x == null ||
    imageAttributes.imageRect.y == null ||
    imageAttributes.imageRect.width == null ||
    imageAttributes.imageRect.height == null ||
    imageAttributes.scaleFactor == null ||
    sequenceNumber == null ||
    image == null
  ) {
    throw new Error('Invalid payload');
  }

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
        position: Vector3.create({
          x: sceneAttributes.camera.position?.x || undefined,
          y: sceneAttributes.camera.position?.y || undefined,
          z: sceneAttributes.camera.position?.z || undefined,
        }),
        lookAt: Vector3.create({
          x: sceneAttributes.camera.lookAt?.x || undefined,
          y: sceneAttributes.camera.lookAt?.y || undefined,
          z: sceneAttributes.camera.lookAt?.z || undefined,
        }),
        up: Vector3.create({
          x: sceneAttributes.camera.up?.x || undefined,
          y: sceneAttributes.camera.up?.y || undefined,
          z: sceneAttributes.camera.up?.z || undefined,
        }),
      }),
      visibleBoundingBox: BoundingBox.create(
        Vector3.create({
          x: sceneAttributes.visibleBoundingBox?.xmin || undefined,
          y: sceneAttributes.visibleBoundingBox?.ymin || undefined,
          z: sceneAttributes.visibleBoundingBox?.zmin || undefined,
        }),
        Vector3.create({
          x: sceneAttributes.visibleBoundingBox?.xmax || undefined,
          y: sceneAttributes.visibleBoundingBox?.ymax || undefined,
          z: sceneAttributes.visibleBoundingBox?.zmax || undefined,
        })
      ),
      crossSectioning: CrossSectioning.create({
        sectionPlanes: sceneAttributes.crossSectioning?.sectionPlanes?.map(
          (sp) => ({
            normal: Vector3.create({
              x: sp.normal?.x || undefined,
              y: sp.normal?.y || undefined,
              z: sp.normal?.z || undefined,
            }),
            offset: sp.offset || 0,
          })
        ),
      }),
    },
    sequenceNumber: sequenceNumber,
    image,
    depthBuffer: depthBuffer?.value || undefined,
  };
};
