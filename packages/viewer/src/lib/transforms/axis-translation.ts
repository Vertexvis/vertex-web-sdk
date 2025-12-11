import { Angle, Matrix4, Quaternion, Ray, Vector3 } from '@vertexvis/geometry';

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

export function xyAxisTranslationPositions(
  widgetTransform: Matrix4.Matrix4,
  camera: FrameCameraBase,
  triangleSize = 3,
  rotationSizeScalar = 1
): TriangleMeshPoints {
  return computeTwoAxisTranslationNdcValues(
    widgetTransform,
    camera,
    Vector3.right(),
    Vector3.up(),
    triangleSize,
    rotationSizeScalar
  );
}

export function xzAxisTranslationPositions(
  widgetTransform: Matrix4.Matrix4,
  camera: FrameCameraBase,
  triangleSize = 3,
  rotationSizeScalar = 1
): TriangleMeshPoints {
  return computeTwoAxisTranslationNdcValues(
    widgetTransform,
    camera,
    Vector3.right(),
    Vector3.back(),
    triangleSize,
    rotationSizeScalar
  );
}

export function yzAxisTranslationPositions(
  widgetTransform: Matrix4.Matrix4,
  camera: FrameCameraBase,
  triangleSize = 3,
  rotationSizeScalar = 1
): TriangleMeshPoints {
  return computeTwoAxisTranslationNdcValues(
    widgetTransform,
    camera,
    Vector3.back(),
    Vector3.up(),
    triangleSize,
    rotationSizeScalar
  );
}

function computeTwoAxisTranslationNdcValues(
  widgetTransform: Matrix4.Matrix4,
  camera: FrameCameraBase,
  xDirection: Vector3.Vector3,
  yDirection: Vector3.Vector3,
  triangleSize: number,
  rotationSizeScalar = 1
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
    Vector3.scale(triangleSize * 2.5, transformedDirection)
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
    Ray.at(yRay, -(triangleSize * rotationSizeScalar)),
    rotationAxis,
    position
  );
  const right = Vector3.rotateAboutAxis(
    Angle.toRadians(45),
    Ray.at(xRay, triangleSize * rotationSizeScalar),
    rotationAxis,
    position
  );
  const up = Vector3.rotateAboutAxis(
    Angle.toRadians(45),
    Ray.at(yRay, triangleSize * rotationSizeScalar),
    rotationAxis,
    position
  );
  const left = Vector3.rotateAboutAxis(
    Angle.toRadians(45),
    Ray.at(xRay, -(triangleSize * rotationSizeScalar)),
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
