import {
  Angle,
  Dimensions,
  Matrix4,
  Point,
  Vector3,
} from '@vertexvis/geometry';

export function computeWorldPosition(
  inverseProjection: Matrix4.Matrix4,
  inverseView: Matrix4.Matrix4,
  viewport: Dimensions.Dimensions,
  point: Point.Point,
  depth: number,
  near: number,
  far: number,
  distanceToCenterRatio: number
): Vector3.Vector3 {
  const normalizedDeviceCoordinate = computeNormalizedDeviceCoordinates(
    viewport,
    point,
    distanceToCenterRatio
  );

  const inverseProjPoint = Matrix4.multiplyVector3(
    inverseProjection,
    normalizedDeviceCoordinate
  );

  const scaledProjPoint = Vector3.scale(
    1.0 / inverseProjPoint.w,
    inverseProjPoint
  );

  // Convert the depth to be relative to the clicked point rather than the
  // view vector.
  const angle =
    Math.abs(normalizedDeviceCoordinate.x * 22.5) +
    Math.abs(normalizedDeviceCoordinate.y * 22.5);

  const relativeDepth = depth / Math.cos(Angle.toRadians(angle));

  // The z-component is replaced here to represent the actual depth of the point
  // in world space.
  return Matrix4.multiplyVector3(inverseView, {
    ...scaledProjPoint,
    // LinearDepth is flipped due to the coordinate system changing when multiplying
    // by the inverse projection matrix.
    z: -linearDepth(relativeDepth, near, far),
  });
}

/**
 * Returns the normalized device coordinate for a point.
 *
 * Normalized device coordinates are represented as a range
 * from [-1, 1] for the x, y, and z components of a vector.
 * X: [-1, 1] = [left, right]
 * Y: [-1, 1] = [bottom, top]
 * Z: [-1, 1] = [near, far]
 * If a depth is not provided, zero is used.
 *
 * These values are further scaled to reflect the position
 * within the viewport of a model that has its camera fit to the
 * visible bounding box. This corrects for inconsistencies when
 * the camera is located in the model's visible bounding box.
 *
 * @param viewport - The viewport of the scene.
 * @param point - The screen position of a click.
 * @param distanceToCenterRatio - The ratio between the cameras current
 * distance to the center of the bounding box compared to the distance to
 * the center when fit to the bounding box. This corrects the normalized
 * values to be relative to the original viewport.
 * @param depth - The depth from [0, 1] between the near and far planes.
 */
export function computeNormalizedDeviceCoordinates(
  viewport: Dimensions.Dimensions,
  point: Point.Point,
  distanceToCenterRatio: number,
  depth?: number
): Vector3.Vector3 {
  return Vector3.create(
    ((point.x * 2.0) / viewport.width - 1) * distanceToCenterRatio,
    (1 - (point.y * 2.0) / viewport.height) * distanceToCenterRatio,
    depth != null ? depth * 2 - 1 : 0
  );
}

function linearDepth(depth: number, near: number, far: number): number {
  return depth * (far - near) + near;
}
