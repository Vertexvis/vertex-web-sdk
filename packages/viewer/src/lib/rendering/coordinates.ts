import {
  Angle,
  Dimensions,
  Matrix4,
  Point,
  Ray,
  Vector3,
} from '@vertexvis/geometry';
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
  const vv = camera.viewVector();
  const ray = Ray.create({
    direction: normalizedRayFromPoint(camera, viewport, point),
    origin: camera.position,
  });

  // Compute the world position along the ray at the far plane.
  // This is used to determine the angle with the view vector.
  const worldPt = Ray.at(ray, camera.far);
  const eyeToWorldPt = Vector3.subtract(worldPt, camera.position);

  const angle =
    Vector3.dot(vv, eyeToWorldPt) /
    (Vector3.magnitude(vv) * Vector3.magnitude(eyeToWorldPt));
  return Ray.at(ray, linearDepth(depth, camera.near, camera.far) / angle);
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
  const m = Matrix4.position(
    Matrix4.makeLookAt(camera.position, camera.lookAt, camera.up),
    Matrix4.makeIdentity()
  );

  const direction = Vector3.create(
    (point.x / viewport.width - 0.5) * camera.aspectRatio,
    -(point.y / viewport.height) + 0.5,
    -0.5 / Math.tan(Angle.toRadians(camera.fovY / 2.0))
  );

  return Vector3.normalize(Vector3.transformMatrix(direction, m));
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
