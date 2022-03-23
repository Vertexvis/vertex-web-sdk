import { vertexvis } from '@vertexvis/frame-streaming-protos';
import { Angle, BoundingBox, Vector3 } from '@vertexvis/geometry';

export interface PerspectiveFrameCamera {
  position: Vector3.Vector3;
  lookAt: Vector3.Vector3;
  up: Vector3.Vector3;
  fovY: number;
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
  const asPerspective = camera as PerspectiveFrameCamera;
  return asPerspective.position != null && asPerspective.fovY != null;
}

export function isOrthographicFrameCamera(
  camera: Partial<FrameCamera>
): camera is OrthographicFrameCamera {
  const asOrtho = camera as OrthographicFrameCamera;
  return asOrtho.viewVector != null && asOrtho.fovHeight != null;
}

export function withPositionAndViewVector(camera: FrameCamera): FrameCamera & {
  position: Vector3.Vector3;
  viewVector: Vector3.Vector3;
} {
  if (isOrthographicFrameCamera(camera)) {
    return {
      ...camera,
      position: Vector3.add(camera.lookAt, Vector3.negate(camera.viewVector)),
    };
  } else {
    return {
      ...camera,
      viewVector: Vector3.subtract(camera.lookAt, camera.position),
    };
  }
}

export function createPerspective(
  data: Partial<PerspectiveFrameCamera> = {}
): PerspectiveFrameCamera {
  return {
    position: data.position ?? Vector3.forward(),
    lookAt: data.lookAt ?? Vector3.origin(),
    up: data.up ?? Vector3.up(),
    fovY: data.fovY ?? 45,
  };
}

export function createOrthographic(
  data: Partial<OrthographicFrameCamera> = {}
): OrthographicFrameCamera {
  return {
    viewVector: data.viewVector ?? Vector3.back(),
    lookAt: data.lookAt ?? Vector3.origin(),
    up: data.up ?? Vector3.up(),
    fovHeight: data.fovHeight ?? 1.0,
  };
}

export function toOrthographic(
  data: PerspectiveFrameCamera,
  boundingBox: BoundingBox.BoundingBox
): OrthographicFrameCamera {
  const viewVector = Vector3.subtract(data.lookAt, data.position);
  const boundingBoxCenter = BoundingBox.center(boundingBox);
  const centerToBoundingPlane = Vector3.subtract(
    boundingBox.max,
    boundingBoxCenter
  );
  const radius = Vector3.magnitude(centerToBoundingPlane);
  const scale = radius / Vector3.magnitude(viewVector);

  return {
    viewVector: Vector3.scale(scale, viewVector),
    up: data.up,
    lookAt: data.lookAt,
    fovHeight:
      2 *
      Vector3.magnitude(viewVector) *
      Math.tan(Angle.toRadians(data.fovY / 2.0)),
  };
}

export function toPerspective(
  data: OrthographicFrameCamera,
  fovY = 45
): PerspectiveFrameCamera {
  const expectedMagnitude =
    data.fovHeight / (2 * Math.tan(Angle.toRadians(fovY / 2.0)));
  const receivedMagnitude = Vector3.magnitude(data.viewVector);
  const magnitudeScale = expectedMagnitude / receivedMagnitude;

  return {
    position: Vector3.add(
      data.lookAt,
      Vector3.negate(Vector3.scale(magnitudeScale, data.viewVector))
    ),
    up: data.up,
    lookAt: data.lookAt,
    fovY,
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
