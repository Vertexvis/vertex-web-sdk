import { vertexvis } from '@vertexvis/frame-streaming-protos';
import { Angle, Vector3 } from '@vertexvis/geometry';

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

export function createOrthographic(
  data: Partial<OrthographicFrameCamera> = {}
): OrthographicFrameCamera {
  return {
    viewVector: data.viewVector || Vector3.back(),
    lookAt: data.lookAt || Vector3.origin(),
    up: data.up || Vector3.up(),
    fovHeight: data.fovHeight ?? 45,
  };
}

export function toOrthographic(
  data: PerspectiveFrameCamera
): OrthographicFrameCamera {
  const viewVector = Vector3.subtract(data.lookAt, data.position);

  console.log(data);

  return {
    viewVector,
    up: data.up,
    lookAt: data.lookAt,
    fovHeight:
      2 * Vector3.magnitude(viewVector) * Math.tan(Angle.toRadians(22.5)),
  };
}

export function toPerspective(
  data: OrthographicFrameCamera
): PerspectiveFrameCamera {
  const expectedMagnitude =
    data.fovHeight / (2 * Math.tan(Angle.toRadians(22.5)));
  const receivedMagnitude = Vector3.magnitude(data.viewVector);
  const magnitudeScale = expectedMagnitude / receivedMagnitude;

  return {
    position: Vector3.add(
      data.lookAt,
      Vector3.scale(magnitudeScale, data.viewVector)
    ),
    up: data.up,
    lookAt: data.lookAt,
  };
}

export function toProtobuf(
  camera: Partial<FrameCamera>
): vertexvis.protobuf.stream.ICamera {
  if (isOrthographicFrameCamera(camera)) {
    return {
      orthographic: {
        viewVector: { ...camera.viewVector },
        lookAt: { ...camera.lookAt },
        up: { ...camera.up },
        fovHeight: camera.fovHeight,
      },
    };
  } else if (isPerspectiveFrameCamera(camera)) {
    return {
      perspective: {
        position: { ...camera.position },
        lookAt: { ...camera.lookAt },
        up: { ...camera.up },
      },
      position: { ...camera.position },
      lookAt: { ...camera.lookAt },
      up: { ...camera.up },
    };
  } else {
    return {
      ...camera,
    };
  }
}
