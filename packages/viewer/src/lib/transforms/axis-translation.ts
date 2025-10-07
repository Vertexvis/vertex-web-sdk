import { Matrix4, Quaternion, Ray, Vector3 } from '@vertexvis/geometry';

import { FrameCameraBase } from '../types';
import { TriangleMeshPoints } from './mesh';

export function xAxisArrowPositions(
  widgetTransform: Matrix4.Matrix4,
  camera: FrameCameraBase,
  triangleSize = 3,
  sizeScalar = 1
): TriangleMeshPoints {
  return computeArrowNdcValues(
    widgetTransform,
    camera,
    Vector3.right(),
    triangleSize,
    sizeScalar
  );
}

export function yAxisArrowPositions(
  widgetTransform: Matrix4.Matrix4,
  camera: FrameCameraBase,
  triangleSize = 3,
  sizeScalar = 1
): TriangleMeshPoints {
  return computeArrowNdcValues(
    widgetTransform,
    camera,
    Vector3.up(),
    triangleSize,
    sizeScalar
  );
}

export function zAxisArrowPositions(
  widgetTransform: Matrix4.Matrix4,
  camera: FrameCameraBase,
  triangleSize = 3,
  sizeScalar = 1
): TriangleMeshPoints {
  return computeArrowNdcValues(
    widgetTransform,
    camera,
    Vector3.back(),
    triangleSize,
    sizeScalar
  );
}

export function computeArrowNdcValues(
  widgetTransform: Matrix4.Matrix4,
  camera: FrameCameraBase,
  direction: Vector3.Vector3,
  triangleSize: number,
  sizeScalar = 1
): TriangleMeshPoints {
  const transformedDirection = Vector3.transformMatrix(
    direction,
    Matrix4.makeRotation(Quaternion.fromMatrixRotation(widgetTransform))
  );

  const basePosition = Vector3.fromMatrixPosition(widgetTransform);
  const position = Vector3.add(
    basePosition,
    Vector3.scale(triangleSize * 9, transformedDirection)
  );

  const worldX = Vector3.normalize(
    Vector3.cross(transformedDirection, Vector3.normalize(camera.viewVector))
  );
  const xRay = Ray.create({
    origin: position,
    direction: worldX,
  });
  const yRay = Ray.create({
    origin: position,
    direction: transformedDirection,
  });

  const left = Ray.at(xRay, -(triangleSize * sizeScalar * 1.25));
  const right = Ray.at(xRay, triangleSize * sizeScalar * 1.25);
  const up = Ray.at(yRay, triangleSize * sizeScalar * 3);

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
