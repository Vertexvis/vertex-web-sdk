import { Point, Ray, Vector3 } from '@vertexvis/geometry';

import { Frame, Viewport } from '../../lib/types';
import { OutlinedTriangleMesh } from './mesh';

export function testTriangleMesh(
  viewport: Viewport,
  point: Point.Point,
  frame: Frame,
  mesh: OutlinedTriangleMesh
): boolean {
  const ray = viewport.transformPointToRay(
    point,
    frame.image,
    frame.scene.camera
  );

  return testPosition(ray, [
    mesh.meshPoints.worldLeft,
    mesh.meshPoints.worldRight,
    mesh.meshPoints.worldTip,
  ]);
}

function testPosition(ray: Ray.Ray, position: Vector3.Vector3[]): boolean {
  const epsilon = 0.00000001;
  const edge1 = Vector3.subtract(position[1], position[0]);
  const edge2 = Vector3.subtract(position[2], position[0]);

  const pvec = Vector3.cross(ray.direction, edge2);
  const det = Vector3.dot(edge1, pvec);

  if (det > -epsilon && det < epsilon) {
    return false;
  }

  const f = 1.0 / det;
  const tvec = Vector3.subtract(ray.origin, position[0]);
  const u = f * Vector3.dot(tvec, pvec);

  if (u < 0 || u > 1) {
    return false;
  }

  const qvec = Vector3.cross(tvec, edge1);
  const v = f * Vector3.dot(ray.direction, qvec);

  if (v < 0 || u + v > 1) {
    return false;
  }

  const t = Vector3.dot(edge2, qvec) / det;

  return !isNaN(t);
}
