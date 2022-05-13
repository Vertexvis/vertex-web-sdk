import { BoundingBox, Point, Vector3 } from '@vertexvis/geometry';

import { Frame, Viewport } from '../../lib/types';
import { TriangleMesh } from './mesh';

/**
 * Adapted from https://en.wikipedia.org/wiki/M%C3%B6ller%E2%80%93Trumbore_intersection_algorithm.
 */
export function testTriangleMesh(
  mesh: TriangleMesh,
  frame: Frame,
  viewport: Viewport,
  point: Point.Point
): boolean {
  const ray = viewport.transformPointToRay(
    point,
    frame.image,
    frame.scene.camera
  );

  const edge1 = Vector3.subtract(mesh.points.worldRight, mesh.points.worldLeft);
  const edge2 = Vector3.subtract(mesh.points.worldTip, mesh.points.worldLeft);

  const epsilon = BoundingBox.epsilon(
    BoundingBox.fromVectors([ray.direction, ray.origin, edge1, edge2]) ??
      BoundingBox.create(edge1, edge2)
  );

  const p = Vector3.cross(ray.direction, edge2);
  const det = Vector3.dot(edge1, p);

  if (Math.abs(det) < epsilon) {
    return false;
  }

  const t = Vector3.subtract(ray.origin, mesh.points.worldLeft);
  const u = Vector3.dot(t, p) / det;

  if (u < 0 || u > 1) {
    return false;
  }

  const q = Vector3.cross(t, edge1);
  const v = Vector3.dot(ray.direction, q) / det;

  if (v < 0 || u + v > 1) {
    return false;
  }

  const r = Vector3.dot(edge2, q) / det;

  return !isNaN(r) && r > epsilon;
}
