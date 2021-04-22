import { Dimensions, Matrix4, Point, Vector3 } from '@vertexvis/geometry';
import { Camera } from '../scenes';

export function computeWorldPosition(
  inverseProjection: Matrix4.Matrix4,
  inverseView: Matrix4.Matrix4,
  viewport: Dimensions.Dimensions,
  point: Point.Point,
  depth: number,
): Vector3.Vector3 {
  const normalizedDeviceCoordinate = computeNormalizedDeviceCoordinates(
    viewport,
    point,
    depth
  );

  const inverseProjPoint = Matrix4.multiplyVector3(
    inverseProjection,
    normalizedDeviceCoordinate
  );

  console.log(inverseProjPoint);

  const scaledProjPoint = Vector3.scale(
    1.0 / inverseProjPoint.w,
    inverseProjPoint
  );

  console.log('scaledprojpoint', scaledProjPoint);

  console.log('NDC', normalizedDeviceCoordinate);
  console.log('3D', Matrix4.multiplyVector3(inverseView, scaledProjPoint));

  return Matrix4.multiplyVector3(inverseView, scaledProjPoint);
}

export function computeNormalizedDeviceCoordinates(
  viewport: Dimensions.Dimensions,
  point: Point.Point,
  depth: number
): Vector3.Vector3 {
  return Vector3.create(
    (point.x * 2.0) / viewport.width - 1,
    1 - (point.y * 2.0) / viewport.height,
    // depth * 2.0 - 1
    depth
  );
}
