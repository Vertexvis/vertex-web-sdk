import { Matrix4, Quaternion, Ray, Vector3 } from '@vertexvis/geometry';

import { FrameCameraBase } from '../types';
import { RectangleMeshPoints } from './mesh';

export function computePointNdcValues(
  transform: Matrix4.Matrix4,
  camera: FrameCameraBase,
  direction: Vector3.Vector3,
  rectangleSize: number
): RectangleMeshPoints {
  const transformedDirection = Vector3.transformMatrix(
    direction,
    Matrix4.makeRotation(Quaternion.fromMatrixRotation(transform))
  );

  const position = Vector3.fromMatrixPosition(transform);

  const worldX = Vector3.normalize(
    Vector3.cross(transformedDirection, Vector3.up())
  );
  const worldY = Vector3.normalize(Vector3.cross(worldX, transformedDirection));
  const xRay = Ray.create({
    origin: position,
    direction: worldX,
  });
  const yRay = Ray.create({
    origin: position,
    direction: worldY,
  });

  const bottomLeft = Ray.at(xRay, -(rectangleSize / 2));
  const topLeft = Ray.at(yRay, -(rectangleSize / 2));
  const bottomRight = Ray.at(yRay, rectangleSize / 2);
  const topRight = Ray.at(xRay, rectangleSize / 2);

  return new RectangleMeshPoints(
    !isNaN(worldX.x),
    position,
    bottomLeft,
    topLeft,
    bottomRight,
    topRight,
    Vector3.transformMatrix(position, camera.projectionViewMatrix),
    Vector3.transformMatrix(bottomLeft, camera.projectionViewMatrix),
    Vector3.transformMatrix(topLeft, camera.projectionViewMatrix),
    Vector3.transformMatrix(bottomRight, camera.projectionViewMatrix),
    Vector3.transformMatrix(topRight, camera.projectionViewMatrix)
  );
}
