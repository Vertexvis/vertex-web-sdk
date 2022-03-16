import { BoundingBox, Vector3 } from '@vertexvis/geometry';

import { FrameCamera } from './frameCamera';

export interface ClippingPlanes {
  near: number;
  far: number;
}

export function fromBoundingBoxAndLookAtCamera(
  boundingBox: BoundingBox.BoundingBox,
  camera: FrameCamera
): ClippingPlanes {
  return fromBoundingBoxAndPerspectiveCamera(boundingBox, camera);
}

// Logic pulled from https://github.com/Vertexvis/rendering-client-lib-java/blob/master/src/main/java/com/vertexvis/rendering/graphics/PerspectiveCamera.java#L65
// and needs to remain in sync with that computation.
// TODO: revisit computation of these values in a single location
export function fromBoundingBoxAndPerspectiveCamera(
  boundingBox: BoundingBox.BoundingBox,
  camera: FrameCamera
): ClippingPlanes {
  const boundingBoxCenter = BoundingBox.center(boundingBox);
  const centerToBoundingPlane = Vector3.subtract(
    boundingBox.max,
    boundingBoxCenter
  );
  const radius = Vector3.magnitude(centerToBoundingPlane);
  const length = Math.max(radius, Vector3.magnitude(boundingBoxCenter));
  const epsilon = length === 0 ? 1.0 : length * 1e-6;
  const minRange = epsilon * 1e2;

  const signedDistToEye = Vector3.dot(
    Vector3.subtract(boundingBoxCenter, camera.position),
    Vector3.normalize(Vector3.subtract(camera.lookAt, camera.position))
  );

  const bRadius = Math.max(radius, minRange);

  let newFar =
    bRadius + signedDistToEye < minRange
      ? bRadius * 3.0
      : bRadius + signedDistToEye;

  let newNear =
    newFar - bRadius * 2.0 < minRange
      ? Math.min(minRange, newFar)
      : newFar - bRadius * 2.0;

  if (newFar - newNear < minRange) {
    newNear = Math.max(newNear, minRange);
    newFar += newNear + minRange;
  } else if (newNear / newFar < 0.0001) {
    newNear = newFar * 0.0001;
  }

  if (newNear > newFar - bRadius * 2.0) {
    if (newNear > 1000 + minRange) {
      newFar -= newNear - 1000;
      newNear = 1000;
    }
  }

  return {
    near: newNear,
    far: newFar,
  };
}
