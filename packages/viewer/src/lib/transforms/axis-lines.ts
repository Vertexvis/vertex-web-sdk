import { Matrix4, Vector3 } from '@vertexvis/geometry';

import { FrameCameraBase } from '../types';
import { AxisMeshPoints, TriangleMesh } from './mesh';

export function axisPositions(
  widgetTransform: Matrix4.Matrix4,
  camera: FrameCameraBase,
  arrowMesh: TriangleMesh
): AxisMeshPoints {
  const position = Vector3.fromMatrixPosition(widgetTransform);
  return new AxisMeshPoints(
    arrowMesh.points.valid,
    position,
    arrowMesh.points.worldBase,
    Vector3.transformMatrix(position, camera.projectionViewMatrix),
    arrowMesh.points.base
  );
}
