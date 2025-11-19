import { vertexvis } from '@vertexvis/frame-streaming-protos';
import { BoundingBox } from '@vertexvis/geometry';

import { FrameCamera } from './frameCamera';
import ISceneItemQueryExpression = vertexvis.protobuf.stream.ISceneItemQueryExpression;

interface FlyToSuppliedId {
  type: 'supplied';
  data: string;
}

interface FlyToItemId {
  type: 'internal';
  data: string;
}

interface FlyToBoundingBox {
  type: 'bounding-box';
  data: BoundingBox.BoundingBox;
}

interface FlyToCamera {
  type: 'camera';
  data: Partial<FrameCamera>;
}

interface FlyToSceneItemQueryExpression {
  type: 'scene-item-query';
  data: ISceneItemQueryExpression;
}

export type FlyToType =
  | FlyToSuppliedId
  | FlyToItemId
  | FlyToBoundingBox
  | FlyToCamera
  | FlyToSceneItemQueryExpression;

export interface FlyToOptions {
  flyTo: FlyToType;
}

export function create(data: Partial<FlyToOptions> = {}): FlyToOptions {
  return {
    flyTo: data.flyTo || {
      type: 'internal',
      data: '',
    },
  };
}
