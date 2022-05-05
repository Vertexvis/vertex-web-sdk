import { Plane, Point, Ray, Vector3 } from '@vertexvis/geometry';
import regl from 'regl';

import { Frame, FrameCamera, Viewport } from '../types';
import { OutlineMesh, TriangleMesh } from './mesh';

export function xAxisMesh(
  reglCommand: regl.Regl,
  position: Vector3.Vector3,
  viewport: Viewport,
  camera: FrameCamera.PerspectiveFrameCamera,
  triangleSize = 3
): TriangleMesh {
  return new TriangleMesh(
    reglCommand,
    'x-translate',
    xAxisPositions(position, viewport, camera, triangleSize).map((p) =>
      Vector3.toArray(p)
    ),
    triangleElements().map((p) => Vector3.toArray(p)),
    Vector3.right()
  );
}

export function xAxisOutlineMesh(
  reglCommand: regl.Regl,
  position: Vector3.Vector3,
  viewport: Viewport,
  camera: FrameCamera.PerspectiveFrameCamera,
  triangleSize = 3
): OutlineMesh {
  return new OutlineMesh(
    reglCommand,
    'x-translate-outline',
    xAxisPositions(position, viewport, camera, triangleSize).map((p) =>
      Vector3.toArray(p)
    ),
    triangleOutlineElements(),
    Vector3.create()
  );
}

function xAxisPositions(
  position: Vector3.Vector3,
  viewport: Viewport,
  camera: FrameCamera.PerspectiveFrameCamera,
  triangleSize = 3,
  axisOffset = 3
): Vector3.Vector3[] {
  const baseOffset = (axisOffset - 1) * (triangleSize * 3);
  const pointOffset = axisOffset * (triangleSize * 3);

  const worldX = Vector3.normalize(
    Vector3.cross(
      Vector3.right(),
      Vector3.normalize(Vector3.subtract(camera.lookAt, camera.position))
    )
  );
  const xRay = Ray.create({
    origin: Vector3.add(position, Vector3.create(pointOffset, 0, 0)),
    direction: worldX,
  });
  const yRay = Ray.create({
    origin: Vector3.add(position, Vector3.create(pointOffset, 0, 0)),
    direction: Vector3.right(),
  });

  const left = Ray.at(xRay, -(triangleSize * 1.25));
  const right = Ray.at(xRay, triangleSize * 1.25);
  const up = Ray.at(yRay, triangleSize * 3);

  return [
    left,
    right,
    up,
    Vector3.add(position, Vector3.create(pointOffset, 0, 0)),
  ];
}

function triangleElements(): Vector3.Vector3[] {
  return [
    Vector3.create(3, 0, 2),
    Vector3.create(3, 1, 2),
    // Vector3.create(1, 4, 2),
    // Vector3.create(3, 4, 0),
    // Vector3.create(3, 4, 1),
    // Vector3.create(0, 4, 2),
  ];
}

function triangleOutlineElements(): Array<number[]> {
  return [
    [0, 1],
    [1, 2],
    [2, 0],
    // Vector3.create(1, 4, 2),
    // Vector3.create(3, 4, 0),
    // Vector3.create(3, 4, 1),
    // Vector3.create(0, 4, 2),
  ];
}
