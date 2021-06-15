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
  const boundingBoxCenter = BoundingBox.center(boundingBox);
  const cameraToCenter = Vector3.subtract(camera.position, boundingBoxCenter);
  const centerToBoundingPlane = Vector3.subtract(
    boundingBox.max,
    boundingBoxCenter
  );
  const distanceToCenterAlongViewVec =
    Math.abs(
      Vector3.dot(
        Vector3.subtract(camera.lookAt, camera.position),
        cameraToCenter
      )
    ) / Vector3.magnitude(Vector3.subtract(camera.lookAt, camera.position));
  const radius = 1.1 * Vector3.magnitude(centerToBoundingPlane);
  let far = distanceToCenterAlongViewVec + radius;
  let near = far * 0.01;

  if (near > distanceToCenterAlongViewVec - radius) {
    if (near > 1000) {
      const difference = near - 1000;
      near = 1000;
      far -= difference;
    } else {
    }
  } else {
    near = distanceToCenterAlongViewVec - radius;
  }

  return { far, near };
}
