import { vertexvis } from '@vertexvis/frame-streaming-protos';
import {
  Angle,
  BoundingBox,
  BoundingSphere,
  Vector3,
} from '@vertexvis/geometry';

export type FrameCameraType = 'perspective' | 'orthographic';

export interface PerspectiveFrameCamera {
  position: Vector3.Vector3;
  lookAt: Vector3.Vector3;
  up: Vector3.Vector3;
  fovY?: number;
}

export interface OrthographicFrameCamera {
  viewVector: Vector3.Vector3;
  lookAt: Vector3.Vector3;
  up: Vector3.Vector3;
  fovHeight: number;
  rotationPoint?: Vector3.Vector3;
}

export type FrameCamera = PerspectiveFrameCamera | OrthographicFrameCamera;

export function isValidFrameCamera(camera: Partial<FrameCamera>): boolean {
  if (isPerspectiveFrameCamera(camera)) {
    const lookAtValid = isValidVector(camera.lookAt);
    const positionValid = isValidVector(camera.position);
    const upValid = isValidNonZeroVector(camera.up);
    return (
      lookAtValid &&
      positionValid &&
      upValid &&
      Vector3.magnitudeSquared(
        Vector3.subtract(camera.lookAt, camera.position),
      ) > 0
    );
  } else {
    const asOrthographic = camera as OrthographicFrameCamera;

    const viewVectorValid = isValidNonZeroVector(asOrthographic.viewVector);
    const lookAtValid = isValidVector(asOrthographic.lookAt);
    const upValid = isValidNonZeroVector(asOrthographic.up);
    const fovHeightValid =
      Number.isFinite(asOrthographic.fovHeight) && asOrthographic.fovHeight > 0;

    return viewVectorValid && lookAtValid && upValid && fovHeightValid;
  }
}

function isValidVector(vector?: Vector3.Vector3): boolean {
  return vector != null && Vector3.isValid(vector);
}

// Zero could be valid, but usually represents a missing value, and will end up pointing the camera at nothing.
function isValidNonZeroVector(vector?: Vector3.Vector3): boolean {
  return (
    vector != null && Vector3.isValid(vector) && !Vector3.isAllZero(vector)
  );
}

export function isPerspectiveFrameCamera(
  camera: Partial<FrameCamera>,
): camera is PerspectiveFrameCamera {
  return (
    (camera as PerspectiveFrameCamera).position != null &&
    (camera as OrthographicFrameCamera).fovHeight == null
  );
}

export function isOrthographicFrameCamera(
  camera: Partial<FrameCamera>,
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
  data: Partial<PerspectiveFrameCamera> = {},
): PerspectiveFrameCamera {
  return {
    position: data.position ?? Vector3.forward(),
    lookAt: data.lookAt ?? Vector3.origin(),
    up: data.up ?? Vector3.up(),
    fovY: data.fovY ?? 45,
  };
}

export function createOrthographic(
  data: Partial<OrthographicFrameCamera> = {},
): OrthographicFrameCamera {
  return {
    viewVector: data.viewVector ?? Vector3.back(),
    lookAt: data.lookAt ?? Vector3.origin(),
    up: data.up ?? Vector3.up(),
    fovHeight: data.fovHeight ?? 1.0,
    rotationPoint: data.rotationPoint ?? data.lookAt ?? Vector3.origin(),
  };
}

export function toOrthographic(
  data: PerspectiveFrameCamera,
  boundingBox: BoundingBox.BoundingBox,
): OrthographicFrameCamera {
  const viewVector = Vector3.subtract(data.lookAt, data.position);
  const boundingSphere = BoundingSphere.create(boundingBox);
  const scale = boundingSphere.radius / Vector3.magnitude(viewVector);

  return {
    viewVector: Vector3.scale(scale, viewVector),
    up: data.up,
    lookAt: data.lookAt,
    fovHeight:
      2 *
      Vector3.magnitude(viewVector) *
      Math.tan(Angle.toRadians((data.fovY ?? 45) / 2.0)),
  };
}

export function toPerspective(
  data: OrthographicFrameCamera,
  fovY = 45,
): PerspectiveFrameCamera {
  const expectedMagnitude =
    data.fovHeight / (2 * Math.tan(Angle.toRadians(fovY / 2.0)));
  const receivedMagnitude = Vector3.magnitude(data.viewVector);
  const magnitudeScale = expectedMagnitude / receivedMagnitude;

  return {
    position: Vector3.add(
      data.lookAt,
      Vector3.negate(Vector3.scale(magnitudeScale, data.viewVector)),
    ),
    up: data.up,
    lookAt: data.lookAt,
    fovY,
  };
}

export function toProtobuf(
  camera: Partial<FrameCamera>,
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
        fovY: camera.fovY
          ? {
              value: camera.fovY,
            }
          : null,
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
