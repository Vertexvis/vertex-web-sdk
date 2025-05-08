import { Matrix4, Vector3 } from '@vertexvis/geometry';

/**
 * Represents an orientation using an `up` and `forward` vector.
 */
export class Orientation {
  /**
   * A default orientation where the up vector points up is represented as `[0, 1, 0]` and
   * forward is represented as `[0, 0, -1]`.
   */
  public static DEFAULT = new Orientation(Vector3.up(), Vector3.back());

  public constructor(
    /**
     * The up orientation vector.
     */
    public readonly y: Vector3.Vector3,

    /**
     * The forward orientation vector.
     */
    public readonly z: Vector3.Vector3
  ) {}

  /**
   * A rotation matrix for this orientation.
   */
  public get matrix(): Matrix4.Matrix4 {
    const z = this.z;
    const y = this.y;
    const x = Vector3.cross(y, z);
    return Matrix4.makeBasis(x, y, z);
  }
}
