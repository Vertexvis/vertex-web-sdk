import { Scene } from '@vertexvis/graphics3d';
import { Dimensions, BoundingBox } from '@vertexvis/geometry';

export interface FrameAttributes {
  operationIds: string[];
  imageSize: Dimensions.Dimensions;
  scene: Scene.Scene;
  visibleBoundingBox: BoundingBox.BoundingBox;
  renderedBoundingBox: BoundingBox.BoundingBox;
}
