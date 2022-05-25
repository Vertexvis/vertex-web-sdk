import { Matrix4, Ray, Vector3 } from '@vertexvis/geometry';

import { FrameCameraBase } from '../types';
import { AxisLinePoints, RotationLinePoints } from './line';
import { DiamondMesh, TriangleMesh } from './mesh';

export function axisPositions(
  widgetTransform: Matrix4.Matrix4,
  camera: FrameCameraBase,
  arrowMesh: TriangleMesh
): AxisLinePoints {
  const position = Vector3.fromMatrixPosition(widgetTransform);
  return new AxisLinePoints(
    arrowMesh.points.valid,
    position,
    arrowMesh.points.worldBase,
    Vector3.transformMatrix(position, camera.projectionViewMatrix),
    arrowMesh.points.base
  );
}

export function rotationAxisPositions(
  camera: FrameCameraBase,
  rotationMesh: DiamondMesh,
  side: 'left' | 'right',
  triangleSize = 3
): RotationLinePoints {
  const origin =
    side === 'left'
      ? rotationMesh.points.worldTip
      : rotationMesh.points.worldLeft;
  const opposite =
    side === 'left'
      ? rotationMesh.points.worldLeft
      : rotationMesh.points.worldTip;

  const directionRay = Ray.create({
    origin,
    direction: Vector3.normalize(Vector3.subtract(opposite, origin)),
  });

  const middle = Ray.at(directionRay, triangleSize);

  const curveRay = Ray.create({
    origin: middle,
    direction: Vector3.normalize(
      Vector3.subtract(rotationMesh.points.worldRight, origin)
    ),
  });

  const end = Ray.at(curveRay, triangleSize);

  console.log(rotationMesh.points, origin, middle, end);

  return new RotationLinePoints(
    true,
    origin,
    middle,
    end,
    Vector3.transformMatrix(origin, camera.projectionViewMatrix),
    Vector3.transformMatrix(middle, camera.projectionViewMatrix),
    Vector3.transformMatrix(end, camera.projectionViewMatrix)
  );
}
