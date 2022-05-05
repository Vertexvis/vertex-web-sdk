import { Point, Rectangle, Vector3 } from '@vertexvis/geometry';
import regl from 'regl';

import { Frame, Viewport } from '../types';

export abstract class Mesh {
  public abstract elements: Array<number[]>;
  public abstract positions: Array<number[]>;
  public abstract identifier: string;

  public abstract draw(): void;
}

export class TriangleMesh implements Mesh {
  public draw = this.reglCommand({
    attributes: {
      position: this.positions,
    },

    elements: this.elements,

    uniforms: {
      color: this.isHovered
        ? [0, 1, 1]
        : this.reglCommand.prop<{ color: number[] }, 'color'>('color'),
    },
  });

  public constructor(
    public reglCommand: regl.Regl,
    public identifier: string,
    public positions: Array<number[]>,
    public elements: Array<number[]>,
    public color: Vector3.Vector3,
    public isHovered: boolean = false
  ) {}

  public static hovered(mesh: TriangleMesh): TriangleMesh {
    return new TriangleMesh(
      mesh.reglCommand,
      mesh.identifier,
      mesh.positions,
      mesh.elements,
      mesh.color,
      true
    );
  }
}

export class OutlineMesh implements Mesh {
  public draw = this.reglCommand({
    primitive: 'lines',

    attributes: {
      position: this.positions,
    },

    elements: this.elements,

    uniforms: {
      color: this.isHovered
        ? [0, 1, 1]
        : this.reglCommand.prop<{ color: number[] }, 'color'>('color'),
    },
  });

  public constructor(
    public reglCommand: regl.Regl,
    public identifier: string,
    public positions: Array<number[]>,
    public elements: Array<number[]>,
    public color: Vector3.Vector3,
    public isHovered: boolean = false
  ) {}

  public static hovered(mesh: TriangleMesh): TriangleMesh {
    return new TriangleMesh(
      mesh.reglCommand,
      mesh.identifier,
      mesh.positions,
      mesh.elements,
      mesh.color,
      true
    );
  }
}

export function computeMesh2dBounds(
  viewport: Viewport,
  frame: Frame,
  ...meshes: Mesh[]
): Rectangle.Rectangle {
  let min = Point.create(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
  let max = Point.create();

  meshes.map((m) => {
    m.positions.forEach((p) => {
      if (p.length === 3) {
        const pt = viewport.transformWorldToViewport(
          Vector3.create(p[0], p[1], p[2]),
          frame.scene.camera.projectionViewMatrix
        );

        min = Point.create(Math.min(pt.x, min.x), Math.min(pt.y, min.y));
        max = Point.create(Math.max(pt.x, max.x), Math.max(pt.y, max.y));
      }
    });
  });

  return Rectangle.fromPoints(min, max);
}
