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
  rotationMesh?: DiamondMesh,
  towardPoint?: Vector3.Vector3,
  triangleSize = 3
): RotationLinePoints | undefined {
  if (rotationMesh != null && towardPoint != null) {
    const baseDistance = Vector3.distance(
      rotationMesh.points.worldBase,
      towardPoint
    );
    const tipDistance = Vector3.distance(
      rotationMesh.points.worldTip,
      towardPoint
    );

    const origin =
      baseDistance < tipDistance
        ? rotationMesh.points.worldBase
        : rotationMesh.points.worldTip;
    const middle = Vector3.scale(0.5, Vector3.add(origin, towardPoint));

    const centerPointRay = Ray.create({
      origin: middle,
      direction: Vector3.normalize(
        Vector3.subtract(
          rotationMesh.points.worldRight,
          rotationMesh.points.worldLeft
        )
      ),
    });

    const worldPoints = [0, 0.05, 0.1, 0.15].map((v) =>
      computeQuadraticBezierCurvePoint(
        origin,
        Ray.at(centerPointRay, triangleSize * 2),
        towardPoint,
        v
      )
    );

    return new RotationLinePoints(
      rotationMesh.points.valid,
      worldPoints,
      worldPoints.map((p) =>
        Vector3.transformMatrix(p, camera.projectionViewMatrix)
      )
    );
  }
  return undefined;
}

function computeQuadraticBezierCurvePoint(
  start: Vector3.Vector3,
  control: Vector3.Vector3,
  end: Vector3.Vector3,
  distance: number
): Vector3.Vector3 {
  const distanceInverse = 1 - distance;
  const startScalar = distanceInverse * distanceInverse;
  const controlScalar = 2 * distanceInverse * distance;
  const endScalar = distance * distance;

  return Vector3.create(
    startScalar * start.x + controlScalar * control.x + endScalar * end.x,
    startScalar * start.y + controlScalar * control.y + endScalar * end.y,
    startScalar * start.z + controlScalar * control.z + endScalar * end.z
  );
}
