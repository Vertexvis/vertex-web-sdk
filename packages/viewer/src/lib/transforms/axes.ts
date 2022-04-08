import { Vector3 } from '@vertexvis/geometry';
import regl from 'regl';

export function drawAxis(
  reglCommand: regl.Regl,
  direction: Vector3.Vector3,
  position: Vector3.Vector3,
  length = 18
): void {
  reglCommand({
    primitive: 'lines',
    count: 2,

    attributes: {
      position: [
        Vector3.toArray(position),
        Vector3.toArray(
          Vector3.add(position, Vector3.scale(length, direction))
        ),
      ],
    },

    uniforms: {
      color: Vector3.toArray(direction),
    },
  })();
}
