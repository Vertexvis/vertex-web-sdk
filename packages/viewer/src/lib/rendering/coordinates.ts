import { Angle, Dimensions, Point, Vector3 } from '@vertexvis/geometry';
import { Camera } from '../scenes';

/**
 * Computes the world position of a click on screen using
 * the provided depth. The depth value is expected to be
 * in the range [0, 1], where 0 represents the near plane
 * distance, and 1 represents the far plane distance.
 *
 * @param camera - The camera of the scene.
 * @param viewport - The viewport of the scene.
 * @param point - The screen point.
 * @param depth - The depth value (between 0 and 1).
 */
export function computeWorldPosition(
  camera: Camera,
  viewport: Dimensions.Dimensions,
  point: Point.Point,
  depth: number
): Vector3.Vector3 {
  const viewVector = camera.viewVector();
  const normalizedRay = normalizedRayFromPoint(camera, viewport, point);

  // Computes the world position along the ray at the far plane.
  // This is used to determine the angle with the view vector.
  const viewVectorToWorldPosition = Vector3.subtract(
    Vector3.add(
      camera.position,
      Vector3.scale(linearDepth(1, camera.near, camera.far), normalizedRay)
    ),
    camera.position
  );

  const angle =
    Vector3.dot(viewVector, viewVectorToWorldPosition) /
    (Vector3.magnitude(viewVector) *
      Vector3.magnitude(viewVectorToWorldPosition));
  return Vector3.add(
    camera.position,
    Vector3.scale(
      linearDepth(depth, camera.near, camera.far) / angle,
      normalizedRay
    )
  );
}

/**
 * Creates a normalized ray at the screen point, pointing
 * away from the camera. This can then be used to find a point
 * at a specific depth along the ray.
 *
 * @param camera - The camera of the scene.
 * @param viewport - The viewport of the scene.
 * @param point - The screen point.
 */
export function normalizedRayFromPoint(
  camera: Camera,
  viewport: Dimensions.Dimensions,
  point: Point.Point
): Vector3.Vector3 {
  const viewVector = camera.viewVector();
  const normalizedUpVector = Vector3.normalize(camera.up);
  const normalizedViewVector = Vector3.normalize(viewVector);
  const crossX = Vector3.normalize(
    Vector3.cross(normalizedUpVector, normalizedViewVector)
  );
  const crossY = Vector3.normalize(Vector3.cross(normalizedViewVector, crossX));

  const direction = Vector3.create(
    (point.x / viewport.width - 0.5) * camera.aspectRatio,
    -(point.y / viewport.height) + 0.5,
    -0.5 / Math.tan(Angle.toRadians(camera.fovY / 2.0))
  );

  return Vector3.normalize(
    Vector3.add(
      Vector3.scale(direction.x, Vector3.scale(-1, crossX)),
      Vector3.scale(direction.y, crossY),
      Vector3.scale(
        direction.z,
        Vector3.scale(-1, Vector3.normalize(viewVector))
      )
    )
  );
}

/**
 * Returns the distance the provided depth represents
 * between the near and far plane.
 *
 * @param depth - The depth value (between 0 and 1).
 * @param near - The near plane value.
 * @param far - The far plane value.
 */
export function linearDepth(depth: number, near: number, far: number): number {
  return depth * (far - near) + near;
}
