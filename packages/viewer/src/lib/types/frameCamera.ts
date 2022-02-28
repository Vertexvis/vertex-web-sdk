import { vertexvis } from '@vertexvis/frame-streaming-protos';
import { Vector3 } from '@vertexvis/geometry';
import { ReplaceCameraPayload } from '@vertexvis/stream-api';

export interface PerspectiveFrameCamera {
  position: Vector3.Vector3;
  lookAt: Vector3.Vector3;
  up: Vector3.Vector3;
}

export interface OrthographicFrameCamera {
  viewVector: Vector3.Vector3;
  lookAt: Vector3.Vector3;
  up: Vector3.Vector3;
  fovHeight: number;
}

export type FrameCamera = PerspectiveFrameCamera | OrthographicFrameCamera;

export function isPerspectiveFrameCamera(
  camera: Partial<FrameCamera>
): camera is PerspectiveFrameCamera {
  return (camera as PerspectiveFrameCamera).position != null;
}

export function isOrthographicFrameCamera(
  camera: Partial<FrameCamera>
): camera is OrthographicFrameCamera {
  const asOrtho = camera as OrthographicFrameCamera;
  return asOrtho.viewVector != null && asOrtho.fovHeight != null;
}

export function createPerspective(
  data: Partial<PerspectiveFrameCamera> = {}
): PerspectiveFrameCamera {
  return {
    position: data.position || Vector3.origin(),
    lookAt: data.lookAt || Vector3.origin(),
    up: data.up || Vector3.up(),
  };
}

export function toProtobuf(
  camera: Partial<FrameCamera>
): vertexvis.protobuf.stream.ICamera {
  if (isOrthographicFrameCamera(camera)) {
    return {
      orthographic: { ...camera },
    };
  } else {
    return {
      perspective: {
        ...camera,
      },
    };
  }
}
