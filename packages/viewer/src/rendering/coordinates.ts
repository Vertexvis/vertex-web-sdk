import { Dimensions, Matrix4, Point, Vector3 } from '@vertexvis/geometry';

export function computeWorldPosition(
  inverseProjection: Matrix4.Matrix4,
  inverseView: Matrix4.Matrix4,
  viewport: Dimensions.Dimensions,
  point: Point.Point,
  depth: number,
  near: number,
  far: number
): Vector3.Vector3 {
  const normalizedDeviceCoordinate = computeNormalizedDeviceCoordinates(
    viewport,
    point
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
  const v1 = Vector3.create(point.x, point.y, 0);
  const v2 = Vector3.create(viewport.width / 2, viewport.height / 2, 0);
  const angle = Math.acos(
    Vector3.dot(v1, v2) / (Vector3.magnitude(v1) * Vector3.magnitude(v2))
  );
  const relativeDepth = depth / Math.cos(angle);

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
 * @param viewport - The viewport of the scene.
 * @param point - The screen position of a click.
 * @param depth - The depth from [0, 1] between the near and far planes.
 */
export function computeNormalizedDeviceCoordinates(
  viewport: Dimensions.Dimensions,
  point: Point.Point,
  depth?: number
): Vector3.Vector3 {
  return Vector3.create(
    (point.x * 2.0) / viewport.width - 1,
    1 - (point.y * 2.0) / viewport.height,
    depth != null ? depth * 2 - 1 : 0
  );
}

function linearDepth(depth: number, near: number, far: number): number {
  return depth * (far - near) + near;
}
