import { BoundingBox } from '@vertexvis/geometry';
import { FrameCamera } from './frameCamera';

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
  data: FrameCamera;
}
export type FlyToType =
  | FlyToSuppliedId
  | FlyToItemId
  | FlyToBoundingBox
  | FlyToCamera;

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
