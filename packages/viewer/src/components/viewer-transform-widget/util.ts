import { Plane, Point, Ray, Vector3 } from '@vertexvis/geometry';

import { Frame, Viewport } from '../../lib/types';

export function convertPointToCanvas(
  point: Point.Point,
  bounds?: DOMRect
): Point.Point | undefined {
  return bounds != null
    ? Point.create(point.x - bounds.left, point.y - bounds.top)
    : undefined;
}

export function convertCanvasPointToWorld(
  point?: Point.Point,
  frame?: Frame,
  viewport?: Viewport,
  position?: Vector3.Vector3
): Vector3.Vector3 | undefined {
  if (point != null && frame != null && viewport != null && position != null) {
    const ray = frame.scene.camera.isPerspective()
      ? viewport.transformPointToRay(point, frame.image, frame.scene.camera)
      : viewport.transformPointToOrthographicRay(
          point,
          frame.image,
          frame.scene.camera
        );
    const positionPlane = Plane.fromNormalAndCoplanarPoint(
      frame.scene.camera.direction,
      position
    );

    return Ray.intersectPlane(ray, positionPlane);
  }
  return undefined;
}

export function computeUpdatedPosition(
  current: Vector3.Vector3,
  previous: Vector3.Vector3,
  next: Vector3.Vector3,
  identifier: string
): Vector3.Vector3 {
  switch (identifier) {
    case 'x-translate':
      return {
        ...current,
        x: Vector3.subtract(next, previous).x + current.x,
      };
    case 'y-translate':
      return {
        ...current,
        y: Vector3.subtract(next, previous).y + current.y,
      };
    case 'z-translate':
      return {
        ...current,
        z: Vector3.subtract(next, previous).z + current.z,
      };
    default:
      return current;
  }
}
