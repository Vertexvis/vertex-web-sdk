import { Angle, Matrix4, Quaternion, Ray, Vector3 } from '@vertexvis/geometry';

import { MeshPoints } from '../../../lib/transforms/mesh';
import { FrameCameraBase } from '../../../lib/types';

export function computePointNdcValues(
  transform: Matrix4.Matrix4,
  camera: FrameCameraBase,
  direction: Vector3.Vector3,
  rectangleSize: number
): MeshPoints {
  const transformedDirection = Vector3.transformMatrix(
    direction,
    Matrix4.makeRotation(Quaternion.fromMatrixRotation(transform))
  );

  const position = Vector3.fromMatrixPosition(transform);

  const worldX = Vector3.normalize(
    Vector3.cross(transformedDirection, Vector3.normalize(camera.viewVector))
  );
  const worldY = Vector3.normalize(Vector3.cross(transformedDirection, worldX));
  const xRay = Ray.create({
    origin: position,
    direction: worldX,
  });
  const yRay = Ray.create({
    origin: position,
    direction: worldY,
  });

  const bottomLeft = Ray.at(xRay, -(rectangleSize / 2.5));
  const topLeft = Ray.at(yRay, -(rectangleSize / 2.5));
  const bottomRight = Ray.at(yRay, rectangleSize / 2.5);
  const topRight = Ray.at(xRay, rectangleSize / 2.5);

  const bottomLeftRotated = Vector3.rotateAboutAxis(
    Angle.toRadians(45),
    bottomLeft,
    transformedDirection,
    position
  );
  const topLeftRotated = Vector3.rotateAboutAxis(
    Angle.toRadians(45),
    topLeft,
    transformedDirection,
    position
  );
  const bottomRightRotated = Vector3.rotateAboutAxis(
    Angle.toRadians(45),
    bottomRight,
    transformedDirection,
    position
  );
  const topRightRotated = Vector3.rotateAboutAxis(
    Angle.toRadians(45),
    topRight,
    transformedDirection,
    position
  );

  const world = [
    bottomLeft,
    bottomLeftRotated,
    topLeft,
    topLeftRotated,
    topRight,
    topRightRotated,
    bottomRight,
    bottomRightRotated,
  ];

  return new MeshPoints(
    !isNaN(worldX.x),
    world,
    world.map((v) => Vector3.transformMatrix(v, camera.projectionViewMatrix)),
    (vector) => Vector3.distance(position, vector)
  );
}
