import { Ray, Vector3 } from '@vertexvis/geometry';

import { FrameCameraBase } from '../types';
import { TriangleMeshPoints } from './mesh';

export function xAxisArrowPositions(
  widgetPosition: Vector3.Vector3,
  camera: FrameCameraBase,
  triangleSize = 3
): TriangleMeshPoints {
  return computeArrowNdcValues(
    widgetPosition,
    camera,
    Vector3.right(),
    triangleSize
  );
}

export function yAxisArrowPositions(
  widgetPosition: Vector3.Vector3,
  camera: FrameCameraBase,
  triangleSize = 3
): TriangleMeshPoints {
  return computeArrowNdcValues(
    widgetPosition,
    camera,
    Vector3.up(),
    triangleSize
  );
}

export function zAxisArrowPositions(
  widgetPosition: Vector3.Vector3,
  camera: FrameCameraBase,
  triangleSize = 3
): TriangleMeshPoints {
  return computeArrowNdcValues(
    widgetPosition,
    camera,
    Vector3.back(),
    triangleSize
  );
}

function computeArrowNdcValues(
  widgetPosition: Vector3.Vector3,
  camera: FrameCameraBase,
  direction: Vector3.Vector3,
  triangleSize: number
): TriangleMeshPoints {
  const position = Vector3.add(
    widgetPosition,
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
    direction,
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
