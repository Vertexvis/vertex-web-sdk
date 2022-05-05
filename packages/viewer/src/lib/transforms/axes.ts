import { Vector3 } from '@vertexvis/geometry';
import regl from 'regl';

export function drawAxis(
  reglCommand: regl.Regl,
  start: Vector3.Vector3,
  end: Vector3.Vector3,
  color: Vector3.Vector3
): void {
  reglCommand({
    primitive: 'lines',
    count: 2,

    attributes: {
      position: [Vector3.toArray(start), Vector3.toArray(end)],
    },

    uniforms: {
      color: Vector3.toArray(color),
    },
  })();
}
