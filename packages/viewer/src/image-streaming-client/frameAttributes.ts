import { Scene } from '@vertexvis/graphics3d';
import { Dimensions, BoundingBox } from '@vertexvis/geometry';
import { vertexvis } from '@vertexvis/frame-stream-protos';

export type FrameAttributes = Pick<
  vertexvis.protobuf.stream.IFrameResult,
  'imageAttributes' | 'sceneAttributes' | 'sequenceNumber'
>;

export interface EedcFrameAttributes {
  operationIds: string[];
  imageSize: Dimensions.Dimensions;
  scene: Scene.Scene;
  visibleBoundingBox: BoundingBox.BoundingBox;
  renderedBoundingBox: BoundingBox.BoundingBox;
}

export function fromEedcFrameAttributes(
  frameAttributes: EedcFrameAttributes
): FrameAttributes {
  return {
    imageAttributes: {
      frameDimensions: frameAttributes.scene.viewport,
      imageRect: {
        x: frameAttributes.renderedBoundingBox.min.x,
        y: frameAttributes.renderedBoundingBox.min.y,
      },
      scaleFactor: 1,
    },
    sceneAttributes: {
      camera: frameAttributes.scene.camera,
    },
    sequenceNumber: -1,
  };
}
