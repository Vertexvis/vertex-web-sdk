import { Angle, Matrix4, Quaternion, Ray, Vector3 } from '@vertexvis/geometry';

import { FrameCameraBase } from '../types';
import { TriangleMeshPoints } from './mesh';

export function xAxisRotationPositions(
  widgetTransform: Matrix4.Matrix4,
  camera: FrameCameraBase,
  triangleSize = 3
): TriangleMeshPoints {
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
): TriangleMeshPoints {
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
): TriangleMeshPoints {
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
): TriangleMeshPoints {
  const transformedDirection = Vector3.transformMatrix(
    Vector3.add(xDirection, yDirection),
    Matrix4.makeRotation(Quaternion.fromMatrixRotation(widgetTransform))
  );
  const transformedX = Vector3.transformMatrix(
    xDirection,
    Matrix4.makeRotation(Quaternion.fromMatrixRotation(widgetTransform))
  );
  const transformedY = Vector3.transformMatrix(
    yDirection,
    Matrix4.makeRotation(Quaternion.fromMatrixRotation(widgetTransform))
  );
  const basePosition = Vector3.fromMatrixPosition(widgetTransform);
  const position = Vector3.add(
    basePosition,
    Vector3.scale(triangleSize * 10, transformedDirection)
  );

  const xRay = Ray.create({
    origin: position,
    direction: transformedX,
  });
  const yRay = Ray.create({
    origin: position,
    direction: transformedY,
  });
  const rotationAxis = Vector3.cross(transformedX, transformedY);

  const base = Vector3.rotateAboutAxis(
    Angle.toRadians(45),
    Ray.at(yRay, -triangleSize),
    rotationAxis,
    position
  );
  const right = Vector3.rotateAboutAxis(
    Angle.toRadians(45),
    Ray.at(xRay, triangleSize),
    rotationAxis,
    position
  );
  const up = Vector3.rotateAboutAxis(
    Angle.toRadians(45),
    Ray.at(yRay, triangleSize),
    rotationAxis,
    position
  );
  const left = Vector3.rotateAboutAxis(
    Angle.toRadians(45),
    Ray.at(xRay, -triangleSize),
    rotationAxis,
    position
  );

  return new TriangleMeshPoints(
    Vector3.dot(transformedX, camera.direction) !== -1 &&
      Vector3.dot(transformedY, camera.direction) !== -1,
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
