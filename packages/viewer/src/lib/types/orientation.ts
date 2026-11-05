import { Matrix4, Vector3 } from '@vertexvis/geometry';

/**
 * Represents an orientation using an `up``, `forward`, and `right` vector.
 */
export class Orientation {
  /**
   * A default orientation where the up vector points up is represented as `[0, 1, 0]` ,
   * forward is represented as `[0, 0, -1]`, and right is represented as `[1, 0, 0]`.
   */
  public static DEFAULT = new Orientation(
    Vector3.up(),
    Vector3.back(),
    Vector3.right(),
  );

  public constructor(
    /**
     * The up orientation vector.
     */
    public readonly y: Vector3.Vector3,

    /**
     * The forward orientation vector.
     */
    public readonly z: Vector3.Vector3,

    /**
     * The right orientation vector.
     */
    public readonly x: Vector3.Vector3,
  ) {}

  /**
   * A rotation matrix for this orientation.
   */
  public get matrix(): Matrix4.Matrix4 {
    return Matrix4.makeBasis(this.x, this.y, this.z);
  }

  /**
   * Whether the orientation is left-handed or right-handed.
   */
  public get isLeftHanded(): boolean {
    const yZForwardCrossProduct = Vector3.cross(this.y, this.z);
    return !Vector3.isEqual(this.x, yZForwardCrossProduct);
  }
}
