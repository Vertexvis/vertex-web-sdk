import { BoundingBox, Point, Vector3 } from '@vertexvis/geometry';

import { Frame, Viewport } from '../../lib/types';
import { DiamondMesh, Mesh, TriangleMesh } from './mesh';

export function testMesh(
  mesh: Mesh,
  frame: Frame,
  viewport: Viewport,
  point: Point.Point
): boolean {
  if (mesh instanceof TriangleMesh) {
    return testTriangleMesh(mesh, frame, viewport, point);
  } else if (mesh instanceof DiamondMesh) {
    return testDiamondMesh(mesh, frame, viewport, point);
  }
  return false;
}

/**
 * Adapted from https://en.wikipedia.org/wiki/M%C3%B6ller%E2%80%93Trumbore_intersection_algorithm.
 */
export function testTriangleMesh(
  mesh: TriangleMesh,
  frame: Frame,
  viewport: Viewport,
  point: Point.Point
): boolean {
  return testTriangle(
    [mesh.points.worldLeft, mesh.points.worldRight, mesh.points.worldTip],
    frame,
    viewport,
    point
  );
}

export function testDiamondMesh(
  mesh: DiamondMesh,
  frame: Frame,
  viewport: Viewport,
  point: Point.Point
): boolean {
  return (
    testTriangle(
      [mesh.points.worldLeft, mesh.points.worldRight, mesh.points.worldTip],
      frame,
      viewport,
      point
    ) ||
    testTriangle(
      [mesh.points.worldLeft, mesh.points.worldRight, mesh.points.worldBase],
      frame,
      viewport,
      point
    )
  );
}

/**
 * Adapted from https://en.wikipedia.org/wiki/M%C3%B6ller%E2%80%93Trumbore_intersection_algorithm.
 */
export function testTriangle(
  points: Vector3.Vector3[],
  frame: Frame,
  viewport: Viewport,
  point: Point.Point
): boolean {
  if (points.length === 3) {
    const ray = frame.scene.camera.isOrthographic()
      ? viewport.transformPointToOrthographicRay(
          point,
          frame.image,
          frame.scene.camera
        )
      : viewport.transformPointToRay(point, frame.image, frame.scene.camera);

    const edge1 = Vector3.subtract(points[1], points[0]);
    const edge2 = Vector3.subtract(points[2], points[0]);

    const epsilon = BoundingBox.epsilon(
      BoundingBox.fromVectors([ray.direction, ray.origin, edge1, edge2]) ??
        BoundingBox.create(edge1, edge2)
    );

    const p = Vector3.cross(ray.direction, edge2);
    const det = Vector3.dot(edge1, p);

    // This check causes a `det` of NaN or 0 to return false
    // without needing to perform the subsequent calculations.
    if (!(Math.abs(det) >= epsilon)) {
      return false;
    }

    const t = Vector3.subtract(ray.origin, points[0]);
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

    // Ignore the case where the computed hit position is negative
    // if in orthographic to correctly return hit results when close
    // to the camera.
    // TODO: revisit with https://vertexvis.atlassian.net/browse/PLAT-1549
    return !isNaN(r) && (r > 0 || frame.scene.camera.isOrthographic());
  }
  return false;
}
