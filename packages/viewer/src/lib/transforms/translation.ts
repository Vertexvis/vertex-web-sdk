import { Plane, Vector3 } from '@vertexvis/geometry';
import regl from 'regl';

import { FrameCamera, Viewport } from '../types';
import { TriangleMesh } from './mesh';

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

export function yAxisMesh(
  reglCommand: regl.Regl,
  position: Vector3.Vector3,
  viewport: Viewport,
  camera: FrameCamera.PerspectiveFrameCamera,
  triangleSize = 3
): TriangleMesh {
  return new TriangleMesh(
    reglCommand,
    'y-translate',
    yAxisPositions(position, viewport, camera, triangleSize).map((p) =>
      Vector3.toArray(p)
    ),
    triangleElements().map((p) => Vector3.toArray(p)),
    Vector3.up()
  );
}

export function zAxisMesh(
  reglCommand: regl.Regl,
  position: Vector3.Vector3,
  viewport: Viewport,
  camera: FrameCamera.PerspectiveFrameCamera,
  triangleSize = 3
): TriangleMesh {
  return new TriangleMesh(
    reglCommand,
    'z-translate',
    zAxisPositions(position, viewport, camera, triangleSize).map((p) =>
      Vector3.toArray(p)
    ),
    triangleElements().map((p) => Vector3.toArray(p)),
    Vector3.back()
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

  return [
    Vector3.add(
      position,
      Vector3.create(baseOffset, triangleSize, triangleSize)
    ),
    Vector3.add(
      position,
      Vector3.create(baseOffset, -triangleSize, -triangleSize)
    ),
    Vector3.add(
      position,
      Vector3.create(baseOffset, triangleSize, -triangleSize)
    ),
    Vector3.add(
      position,
      Vector3.create(baseOffset, -triangleSize, triangleSize)
    ),
    Vector3.add(position, Vector3.create(pointOffset, 0, 0)),
  ];
}

function yAxisPositions(
  position: Vector3.Vector3,
  viewport: Viewport,
  camera: FrameCamera.PerspectiveFrameCamera,
  triangleSize = 3,
  axisOffset = 3
): Vector3.Vector3[] {
  const baseOffset = (axisOffset - 1) * (triangleSize * 3);
  const pointOffset = axisOffset * (triangleSize * 3);

  const plane = Plane.fromNormalAndCoplanarPoint(
    Vector3.normalize(Vector3.subtract(camera.lookAt, camera.position)),
    camera.lookAt
  );

  return [
    Vector3.add(
      position,
      Vector3.create(triangleSize, baseOffset, triangleSize)
    ),
    Vector3.add(
      position,
      Vector3.create(-triangleSize, baseOffset, -triangleSize)
    ),
    Vector3.add(
      position,
      Vector3.create(triangleSize, baseOffset, -triangleSize)
    ),
    Vector3.add(
      position,
      Vector3.create(-triangleSize, baseOffset, triangleSize)
    ),
    Vector3.add(position, Vector3.create(0, pointOffset, 0)),
  ];
}

function zAxisPositions(
  position: Vector3.Vector3,
  viewport: Viewport,
  camera: FrameCamera.PerspectiveFrameCamera,
  triangleSize = 3,
  axisOffset = 3
): Vector3.Vector3[] {
  const baseOffset = (axisOffset - 1) * (triangleSize * 3);
  const pointOffset = axisOffset * (triangleSize * 3);

  return [
    Vector3.add(
      position,
      Vector3.create(triangleSize, triangleSize, baseOffset)
    ),
    Vector3.add(
      position,
      Vector3.create(-triangleSize, -triangleSize, baseOffset)
    ),
    Vector3.add(
      position,
      Vector3.create(-triangleSize, triangleSize, baseOffset)
    ),
    Vector3.add(
      position,
      Vector3.create(triangleSize, -triangleSize, baseOffset)
    ),
    Vector3.add(position, Vector3.create(0, 0, pointOffset)),
  ];
}

function triangleElements(): Vector3.Vector3[] {
  return [
    Vector3.create(1, 4, 2),
    Vector3.create(3, 4, 0),
    Vector3.create(3, 4, 1),
    Vector3.create(0, 4, 2),
  ];
}
