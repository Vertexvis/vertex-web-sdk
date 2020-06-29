import { Vector3 } from '@vertexvis/geometry';

export interface FrameCamera {
  position: Vector3.Vector3;
  lookAt: Vector3.Vector3;
  up: Vector3.Vector3;
}

export function create(data: Partial<FrameCamera> = {}): FrameCamera {
  return {
    position: data.position || Vector3.origin(),
    lookAt: data.lookAt || Vector3.origin(),
    up: data.up || Vector3.up(),
  };
}
