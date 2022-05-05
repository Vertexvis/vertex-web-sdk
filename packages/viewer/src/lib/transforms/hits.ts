import { Point, Ray, Vector3 } from '@vertexvis/geometry';

import { Frame, Viewport } from '../../lib/types';
import { Mesh } from './mesh';

export function testMesh(
  viewport: Viewport,
  point: Point.Point,
  frame: Frame,
  mesh: Mesh
): boolean {
  const ray = viewport.transformPointToRay(
    point,
    frame.image,
    frame.scene.camera
  );

  return mesh.elements.reduce((result: boolean, el) => {
    if (
      el.length === 3 &&
      (testPosition(ray, [
        Vector3.fromArray(mesh.positions[el[0]]),
        Vector3.fromArray(mesh.positions[el[1]]),
        Vector3.fromArray(mesh.positions[el[2]]),
      ]) ||
        testPosition(ray, [
          Vector3.fromArray(mesh.positions[el[1]]),
          Vector3.fromArray(mesh.positions[el[0]]),
          Vector3.fromArray(mesh.positions[el[2]]),
        ]))
    ) {
      return true;
    }
    return result;
  }, false);
}

function testPosition(ray: Ray.Ray, position: Vector3.Vector3[]): boolean {
  const epsilon = 0.00000001;
  const edge1 = Vector3.subtract(position[1], position[0]);
  const edge2 = Vector3.subtract(position[2], position[0]);

  const pvec = Vector3.cross(ray.direction, edge2);
  const det = Vector3.dot(edge1, pvec);

  if (det < epsilon) {
    return false;
  }

  const tvec = Vector3.subtract(ray.origin, position[0]);
  const u = Vector3.dot(tvec, pvec);

  if (u < 0 || u > det) {
    return false;
  }

  const qvec = Vector3.cross(tvec, edge1);
  const v = Vector3.dot(ray.direction, qvec);

  if (v < 0 || u + v > det) {
    return false;
  }

  const t = Vector3.dot(edge2, qvec) / det;

  return !isNaN(t);
}
