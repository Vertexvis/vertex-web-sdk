import {
  Dimensions,
  Vector3,
  Rectangle,
  BoundingBox,
} from '@vertexvis/geometry';
import { vertexvis } from '@vertexvis/frame-streaming-protos';
import * as FrameCamera from './frameCamera';

export interface Frame {
  correlationIds: string[];
  imageAttributes: ImageAttributes;
  sceneAttributes: SceneAttributes;
  sequenceNumber: number;
  near: number;
  far: number;
  image: Uint8Array | Int8Array;
  depth: Uint8Array | undefined;
}

export interface ImageAttributes {
  frameDimensions: Dimensions.Dimensions;
  imageRect: Rectangle.Rectangle;
  scaleFactor: number;
}

export interface SceneAttributes {
  camera: FrameCamera.FrameCamera;
  visibleBoundingBox: BoundingBox.BoundingBox;
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
    },
    sequenceNumber: sequenceNumber,
    near: 0,
    far: 0,
    image: image,
    depth: new Uint8Array(),
  };
};

export const fromProtoWithDepthBuffer = (
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

  const view = new DataView(new Int8Array(image).buffer);

  const near = view.getFloat32(0);
  const far = view.getFloat32(4);
  const imageLen = view.getInt32(8);
  const jpeg = image.slice(4 + 4 + 4, imageLen + 4 + 4 + 4);
  const depth = image.slice(4 + 4 + 4 + imageLen);

  // console.log('near', near);
  // console.log('far', far);
  // console.log('payload len', image.byteLength);
  // console.log('image len', imageLen);
  // console.log('jpeg len', jpeg.length);
  // console.log('depth len', depth.length);

  // const jpegBlob = new Blob([jpeg], { type: 'image/png' });
  // const jpegUrl = URL.createObjectURL(jpegBlob);
  // console.log('jpeg url', jpegUrl);

  // const blob = new Blob([depth], { type: 'image/png' });
  // const url = URL.createObjectURL(blob);
  // console.log('depth url', url);

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
    },
    sequenceNumber: sequenceNumber,
    near,
    far,
    image: jpeg,
    depth: depth.length > 0 ? depth : undefined,
  };
};
