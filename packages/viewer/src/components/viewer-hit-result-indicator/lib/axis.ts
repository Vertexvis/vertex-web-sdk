import { Matrix4, Ray, Vector3 } from '@vertexvis/geometry';

import { TriangleMeshPoints } from '../../../lib/transforms/mesh';
import { FrameCameraBase } from '../../../lib/types';

export function computeArrowNdcValues(
  widgetTransform: Matrix4.Matrix4,
  camera: FrameCameraBase,
  direction: Vector3.Vector3,
  triangleSize: number
): TriangleMeshPoints {
  const basePosition = Vector3.fromMatrixPosition(widgetTransform);
  const position = Vector3.add(
    basePosition,
    Vector3.scale(triangleSize * 9, direction)
  );

  const worldX = Vector3.normalize(
    Vector3.cross(direction, Vector3.normalize(camera.viewVector))
  );
  const xRay = Ray.create({
    origin: position,
    direction: worldX,
  });
  const yRay = Ray.create({
    origin: position,
    direction: direction,
  });

  const left = Ray.at(xRay, -(triangleSize * 1.25));
  const right = Ray.at(xRay, triangleSize * 1.25);
  const up = Ray.at(yRay, triangleSize * 3);

  return new TriangleMeshPoints(
    !isNaN(worldX.x),
    position,
    left,
    right,
    up,
    Vector3.transformMatrix(position, camera.projectionViewMatrix),
    Vector3.transformMatrix(left, camera.projectionViewMatrix),
    Vector3.transformMatrix(right, camera.projectionViewMatrix),
    Vector3.transformMatrix(up, camera.projectionViewMatrix)
  );
}
