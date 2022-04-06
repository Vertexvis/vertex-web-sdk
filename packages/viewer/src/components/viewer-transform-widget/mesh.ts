import { Point, Vector3 } from '@vertexvis/geometry';
import regl from 'regl';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface MeshProps {}

export abstract class Mesh {
  public abstract identifier: string;

  public abstract draw(): void;
}

export interface TriangleProps extends MeshProps {
  color: Vector3.Vector3;
}

export class TriangleMesh implements Mesh {
  public draw = this.reglCommand({
    attributes: {
      position: [this.positions.map((v) => Vector3.toArray(v))],
    },

    elements: this.elements.map((v) => Vector3.toArray(v)),

    uniforms: {
      color: this.isHovered
        ? [0, 1, 1]
        : this.reglCommand.prop<{ color: number[] }, 'color'>('color'),
    },
  });

  public constructor(
    public reglCommand: regl.Regl,
    public identifier: string,
    public positions: Vector3.Vector3[],
    public elements: Vector3.Vector3[],
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
