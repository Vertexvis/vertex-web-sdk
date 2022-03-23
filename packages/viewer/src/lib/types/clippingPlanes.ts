import { BoundingBox, BoundingSphere, Vector3 } from '@vertexvis/geometry';

import { constrainViewVector } from '../rendering/vectors';
import {
  FrameCamera,
  isOrthographicFrameCamera,
  OrthographicFrameCamera,
  PerspectiveFrameCamera,
} from './frameCamera';

export interface ClippingPlanes {
  near: number;
  far: number;
}

export function fromBoundingBoxAndLookAtCamera(
  boundingBox: BoundingBox.BoundingBox,
  camera: FrameCamera
): ClippingPlanes {
  return isOrthographicFrameCamera(camera)
    ? fromBoundingBoxAndOrthographicCamera(boundingBox, camera)
    : fromBoundingBoxAndPerspectiveCamera(boundingBox, camera);
}

// Logic pulled from https://github.com/Vertexvis/rendering-client-lib-java/blob/master/src/main/java/com/vertexvis/rendering/graphics/PerspectiveCamera.java#L65
// and needs to remain in sync with that computation.
// TODO: revisit computation of these values in a single location
export function fromBoundingBoxAndPerspectiveCamera(
  boundingBox: BoundingBox.BoundingBox,
  camera: PerspectiveFrameCamera
): ClippingPlanes {
  const boundingSphere = BoundingSphere.create(boundingBox);
  const minRange = boundingSphere.epsilon * 1e2;

  const signedDistToEye = Vector3.dot(
    Vector3.subtract(boundingSphere.center, camera.position),
    Vector3.normalize(Vector3.subtract(camera.lookAt, camera.position))
  );

  const bRadius = Math.max(boundingSphere.radius, minRange);

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

// Logic pulled from https://github.com/Vertexvis/rendering-client-lib-java/blob/master/src/main/java/com/vertexvis/rendering/graphics/OrthographicCamera.java#L35
// and needs to remain in sync with that computation.
// TODO: revisit computation of these values in a single location
export function fromBoundingBoxAndOrthographicCamera(
  boundingBox: BoundingBox.BoundingBox,
  camera: OrthographicFrameCamera
): ClippingPlanes {
  const boundingSphere = BoundingSphere.create(boundingBox);
  const minRange = boundingSphere.epsilon * 1e2;

  const bRadius = Math.max(boundingSphere.radius, minRange);

  return {
    near: -bRadius,
    far: bRadius,
  };
}
