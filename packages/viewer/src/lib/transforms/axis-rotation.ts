import { Angle, Matrix4, Quaternion, Ray, Vector3 } from '@vertexvis/geometry';

import { FrameCameraBase } from '../types';
import { DiamondMeshPoints } from './mesh';

export function xAxisRotationPositions(
  widgetTransform: Matrix4.Matrix4,
  camera: FrameCameraBase,
  triangleSize = 3
): DiamondMeshPoints {
  return computeRotationNdcValues(
    widgetTransform,
    camera,
    Vector3.back(),
    Vector3.up(),
    triangleSize
  );
}

export function yAxisRotationPositions(
  widgetTransform: Matrix4.Matrix4,
  camera: FrameCameraBase,
  triangleSize = 3
): DiamondMeshPoints {
  return computeRotationNdcValues(
    widgetTransform,
    camera,
    Vector3.right(),
    Vector3.back(),
    triangleSize
  );
}

export function zAxisRotationPositions(
  widgetTransform: Matrix4.Matrix4,
  camera: FrameCameraBase,
  triangleSize = 3
): DiamondMeshPoints {
  return computeRotationNdcValues(
    widgetTransform,
    camera,
    Vector3.right(),
    Vector3.up(),
    triangleSize
  );
}

function computeRotationNdcValues(
  widgetTransform: Matrix4.Matrix4,
  camera: FrameCameraBase,
  xDirection: Vector3.Vector3,
  yDirection: Vector3.Vector3,
  triangleSize: number
): DiamondMeshPoints {
  const transformedDirection = Vector3.transformMatrix(
    Vector3.add(xDirection, yDirection),
    Matrix4.makeRotation(Quaternion.fromMatrixRotation(widgetTransform))
  );
  const basePosition = Vector3.fromMatrixPosition(widgetTransform);
  const position = Vector3.add(
    basePosition,
    Vector3.scale(triangleSize * 8, transformedDirection)
  );

  const xRay = Ray.create({
    origin: position,
    direction: xDirection,
  });
  const yRay = Ray.create({
    origin: position,
    direction: yDirection
  });
  const rotationAxis = Vector3.cross(xDirection, yDirection);

  const base = Vector3.rotateAboutAxis(Angle.toRadians(45), Ray.at(yRay, -(triangleSize * 1.25)), rotationAxis, position)
  const right = Vector3.rotateAboutAxis(Angle.toRadians(45), Ray.at(xRay, triangleSize * 1.25), rotationAxis, position)
  const up = Vector3.rotateAboutAxis(Angle.toRadians(45), Ray.at(yRay, triangleSize * 1.25), rotationAxis, position)
  const left = Vector3.rotateAboutAxis(Angle.toRadians(45), Ray.at(xRay, -(triangleSize * 1.25)), rotationAxis, position)

  return new DiamondMeshPoints(
    true,
    base,
    left,
    right,
    up,
    Vector3.transformMatrix(base, camera.projectionViewMatrix),
    Vector3.transformMatrix(left, camera.projectionViewMatrix),
    Vector3.transformMatrix(right, camera.projectionViewMatrix),
    Vector3.transformMatrix(up, camera.projectionViewMatrix)
  );
}
