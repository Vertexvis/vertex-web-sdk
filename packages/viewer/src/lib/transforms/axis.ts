import { Vector3 } from '@vertexvis/geometry';

import { FrameCameraBase } from '../types';
import { AxisMeshPoints, TriangleMesh } from './mesh';

export function axisPositions(
  widgetPosition: Vector3.Vector3,
  camera: FrameCameraBase,
  arrowMesh: TriangleMesh
): AxisMeshPoints {
  return new AxisMeshPoints(
    arrowMesh.points.valid,
    widgetPosition,
    arrowMesh.points.worldBase,
    Vector3.transformMatrix(widgetPosition, camera.projectionViewMatrix),
    arrowMesh.points.base
  );
}
