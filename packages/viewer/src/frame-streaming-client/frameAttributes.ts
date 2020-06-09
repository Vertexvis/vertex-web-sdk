import { Scene, Camera } from '@vertexvis/graphics3d';
import { Dimensions, Vector3 } from '@vertexvis/geometry';
import { vertexvis } from '@vertexvis/frame-stream-protos';

export interface FrameAttributes {
  operationIds: string[];
  imageSize: Dimensions.Dimensions;
  scene: Scene.Scene;
}

export const create = (
  frameResult: vertexvis.protobuf.stream.IFrameResult
): FrameAttributes => {
  const { imageAttributes, sceneAttributes, sequenceNumber } = frameResult;

  return {
    operationIds: [],
    imageSize: Dimensions.create(
      imageAttributes.imageRect.width,
      imageAttributes.imageRect.height
    ),
    scene: Scene.create(
      Camera.create({
        position: Vector3.create(sceneAttributes.camera.position),
        upvector: Vector3.create(sceneAttributes.camera.up),
        lookat: Vector3.create(sceneAttributes.camera.lookAt),
      }),
      Dimensions.create(
        imageAttributes.frameDimensions.width,
        imageAttributes.frameDimensions.height
      )
    ),
  };
};
