import './glMat4';

import { Matrix4, Point, Ray, Vector3 } from '@vertexvis/geometry';
import regl from 'regl';

import { Frame, FrameCameraBase, Viewport } from '../../lib/types';
import { TriangleMesh } from './mesh';

export function drawDirection(
  reglContext: regl.Regl,
  direction: Vector3.Vector3,
  offset: number,
  position: Vector3.Vector3 = Vector3.create()
): void {
  const triangleBaseOffset = triangleOffset();
  const pointOffset = offset * (triangleBaseOffset * 2);

  reglContext({
    primitive: 'lines',
    count: 2,

    attributes: {
      position: [
        Vector3.toArray(position),
        Vector3.toArray(
          Vector3.add(position, Vector3.scale(pointOffset, direction))
        ),
      ],
    },

    uniforms: {
      color: Vector3.toArray(direction),
    },
  })();
}

function triangleOffset(camera?: FrameCameraBase): number {
  return 3;
}

export function xAxisPositions(
  offset = 1,
  position: Vector3.Vector3 = Vector3.create(),
  camera?: FrameCameraBase
): Vector3.Vector3[] {
  const triangleBaseOffset = triangleOffset(camera);
  const baseOffset = (offset - 1) * (triangleBaseOffset * 3);
  const pointOffset = offset * (triangleBaseOffset * 3);

  return [
    Vector3.add(
      position,
      Vector3.create(baseOffset, triangleBaseOffset, triangleBaseOffset)
    ),
    Vector3.add(
      position,
      Vector3.create(baseOffset, -triangleBaseOffset, -triangleBaseOffset)
    ),
    Vector3.add(
      position,
      Vector3.create(baseOffset, triangleBaseOffset, -triangleBaseOffset)
    ),
    Vector3.add(
      position,
      Vector3.create(baseOffset, -triangleBaseOffset, triangleBaseOffset)
    ),
    Vector3.add(position, Vector3.create(pointOffset, 0, 0)),
  ];
}

export function yAxisPositions(
  offset = 1,
  position: Vector3.Vector3 = Vector3.create(),
  camera?: FrameCameraBase
): Vector3.Vector3[] {
  const triangleBaseOffset = triangleOffset(camera);
  const baseOffset = (offset - 1) * (triangleBaseOffset * 3);
  const pointOffset = offset * (triangleBaseOffset * 3);

  return [
    Vector3.add(
      position,
      Vector3.create(triangleBaseOffset, baseOffset, triangleBaseOffset)
    ),
    Vector3.add(
      position,
      Vector3.create(-triangleBaseOffset, baseOffset, -triangleBaseOffset)
    ),
    Vector3.add(
      position,
      Vector3.create(triangleBaseOffset, baseOffset, -triangleBaseOffset)
    ),
    Vector3.add(
      position,
      Vector3.create(-triangleBaseOffset, baseOffset, triangleBaseOffset)
    ),
    Vector3.add(position, Vector3.create(0, pointOffset, 0)),
  ];
}

export function zAxisPositions(
  offset = 1,
  position: Vector3.Vector3 = Vector3.create(),
  camera?: FrameCameraBase
): Vector3.Vector3[] {
  const triangleBaseOffset = triangleOffset(camera);
  const baseOffset = (offset - 1) * (triangleBaseOffset * 3);
  const pointOffset = offset * (triangleBaseOffset * 3);

  return [
    Vector3.add(
      position,
      Vector3.create(triangleBaseOffset, triangleBaseOffset, baseOffset)
    ),
    Vector3.add(
      position,
      Vector3.create(-triangleBaseOffset, -triangleBaseOffset, baseOffset)
    ),
    Vector3.add(
      position,
      Vector3.create(-triangleBaseOffset, triangleBaseOffset, baseOffset)
    ),
    Vector3.add(
      position,
      Vector3.create(triangleBaseOffset, -triangleBaseOffset, baseOffset)
    ),
    Vector3.add(position, Vector3.create(0, 0, pointOffset)),
  ];
}

export function triangleElements(): Vector3.Vector3[] {
  return [
    Vector3.create(1, 4, 2),
    Vector3.create(3, 4, 0),
    Vector3.create(3, 4, 1),
    Vector3.create(0, 4, 2),
  ];
}

export function computeRay(
  viewport: Viewport,
  point: Point.Point,
  view: Matrix4.Matrix4,
  projection: Matrix4.Matrix4
): Ray.Ray {
  const ndc = Point.create(
    (point.x / viewport.width) * 2 - 1,
    -(point.y / viewport.height) * 2 + 1
  );

  const origin = Vector3.fromMatrixPosition(Matrix4.invert(view));
  const world = Vector3.transformNdcToWorldSpace(
    Vector3.create(ndc.x, ndc.y, 0.5),
    Matrix4.invert(view),
    Matrix4.invert(projection)
  );
  const direction = Vector3.normalize(Vector3.subtract(world, origin));

  return Ray.create({
    origin,
    direction,
  });
}

export function hitTest(
  viewport: Viewport,
  point: Point.Point,
  frame: Frame,
  mesh: TriangleMesh
): boolean {
  const ray = viewport.transformPointToRay(
    point,
    frame.image,
    frame.scene.camera
  );

  return mesh.elements.reduce((result: boolean, el) => {
    if (
      testTriangle(ray, [
        mesh.positions[el.x],
        mesh.positions[el.y],
        mesh.positions[el.z],
      ]) ||
      testTriangle(ray, [
        mesh.positions[el.y],
        mesh.positions[el.x],
        mesh.positions[el.z],
      ])
    ) {
      return true;
    }
    return result;
  }, false);
}

function testTriangle(ray: Ray.Ray, triangle: Vector3.Vector3[]): boolean {
  const epsilon = 0.00000001;
  const edge1 = Vector3.subtract(triangle[1], triangle[0]);
  const edge2 = Vector3.subtract(triangle[2], triangle[0]);

  const pvec = Vector3.cross(ray.direction, edge2);
  const det = Vector3.dot(edge1, pvec);

  if (det < epsilon) {
    return false;
  }

  const tvec = Vector3.subtract(ray.origin, triangle[0]);
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
