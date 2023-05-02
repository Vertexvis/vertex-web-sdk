import { Matrix4, Quaternion, Ray, Vector3 } from '@vertexvis/geometry';

import { FrameCameraBase } from '../types';
import { RectangleMeshPoints } from './mesh';

export function computeRectangleNdcValues(
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

  const worldX =
    Math.abs(Vector3.dot(transformedDirection, Vector3.up())) === 1
      ? Vector3.left()
      : Vector3.normalize(Vector3.cross(transformedDirection, Vector3.up()));
  const worldY = Vector3.normalize(Vector3.cross(worldX, transformedDirection));
  const xRay = Ray.create({
    origin: position,
    direction: worldX,
  });
  const yRay = Ray.create({
    origin: position,
    direction: worldY,
  });

  const bottomLeft = Vector3.rotateAboutAxis(
    Math.PI / 4,
    Ray.at(xRay, -(rectangleSize * 5)),
    transformedDirection,
    position
  );
  const topLeft = Vector3.rotateAboutAxis(
    Math.PI / 4,
    Ray.at(yRay, -(rectangleSize * 5)),
    transformedDirection,
    position
  );
  const bottomRight = Vector3.rotateAboutAxis(
    Math.PI / 4,
    Ray.at(yRay, rectangleSize * 5),
    transformedDirection,
    position
  );
  const topRight = Vector3.rotateAboutAxis(
    Math.PI / 4,
    Ray.at(xRay, rectangleSize * 5),
    transformedDirection,
    position
  );

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
