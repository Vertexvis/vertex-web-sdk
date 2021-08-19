import { Matrix4, Vector3 } from '@vertexvis/geometry';

/**
 * A `StandardView` represents common view orientations for a camera.
 */
export class StandardView {
  /**
   * A standard view that positions the camera facing the front of the scene.
   */
  public static FRONT = new StandardView(Vector3.back(), Vector3.up());

  /**
   * A standard view that positions the camera facing the left of the scene.
   */
  public static LEFT = new StandardView(Vector3.right(), Vector3.up());

  /**
   * A standard view that positions the camera facing the right of the scene.
   */
  public static RIGHT = new StandardView(Vector3.left(), Vector3.up());

  /**
   * A standard view that positions the camera facing the back of the scene.
   */
  public static BACK = new StandardView(Vector3.forward(), Vector3.up());

  /**
   * A standard view that positions the camera facing the top of the scene.
   */
  public static TOP = new StandardView(Vector3.up(), Vector3.forward());

  /**
   * A standard view that positions the camera facing the bottom of the scene.
   */
  public static BOTTOM = new StandardView(Vector3.down(), Vector3.back());

  /**
   * A standard view that positions the camera facing the top-front-right of the
   * scene.
   */
  public static TOP_FRONT_RIGHT = new StandardView(
    Vector3.add(Vector3.back(), Vector3.up(), Vector3.left()),
    Vector3.up()
  );

  /**
   * A standard view that positions the camera facing the top-front-left of the
   * scene.
   */
  public static TOP_FRONT_LEFT = new StandardView(
    Vector3.add(Vector3.back(), Vector3.up(), Vector3.right()),
    Vector3.up()
  );

  /**
   * A standard view that positions the camera facing the bottom-front-right of
   * the scene.
   */
  public static BOTTOM_FRONT_RIGHT = new StandardView(
    Vector3.add(Vector3.back(), Vector3.down(), Vector3.left()),
    Vector3.up()
  );

  /**
   * A standard view that positions the camera facing the bottom-front-left of
   * the scene.
   */
  public static BOTTOM_FRONT_LEFT = new StandardView(
    Vector3.add(Vector3.back(), Vector3.down(), Vector3.right()),
    Vector3.up()
  );

  /**
   * A standard view that positions the camera facing the top-back-left of the
   * scene.
   */
  public static TOP_BACK_LEFT = new StandardView(
    Vector3.add(Vector3.forward(), Vector3.up(), Vector3.right()),
    Vector3.up()
  );

  /**
   * A standard view that positions the camera facing the top-back-right of the
   * scene.
   */
  public static TOP_BACK_RIGHT = new StandardView(
    Vector3.add(Vector3.forward(), Vector3.up(), Vector3.left()),
    Vector3.up()
  );

  /**
   * A standard view that positions the camera facing the bottom-back-left of
   * the scene.
   */
  public static BOTTOM_BACK_LEFT = new StandardView(
    Vector3.add(Vector3.forward(), Vector3.down(), Vector3.right()),
    Vector3.up()
  );

  /**
   * A standard view that positions the camera facing the bottom-back-right of
   * the scene.
   */
  public static BOTTOM_BACK_RIGHT = new StandardView(
    Vector3.add(Vector3.forward(), Vector3.down(), Vector3.left()),
    Vector3.up()
  );

  /**
   * A standard view that positions the camera facing the top-front of the
   * scene.
   */
  public static TOP_FRONT = new StandardView(
    Vector3.add(Vector3.back(), Vector3.up()),
    Vector3.up()
  );

  /**
   * A standard view that positions the camera facing the bottom-front of the
   * scene.
   */
  public static BOTTOM_FRONT = new StandardView(
    Vector3.add(Vector3.back(), Vector3.down()),
    Vector3.up()
  );

  /**
   * A standard view that positions the camera facing the front-right of the
   * scene.
   */
  public static FRONT_RIGHT = new StandardView(
    Vector3.add(Vector3.back(), Vector3.left()),
    Vector3.up()
  );

  /**
   * A standard view that positions the camera facing the front-left of the
   * scene.
   */
  public static FRONT_LEFT = new StandardView(
    Vector3.add(Vector3.back(), Vector3.right()),
    Vector3.up()
  );

  /**
   * A standard view that positions the camera facing the top-back of the scene.
   */
  public static TOP_BACK = new StandardView(
    Vector3.add(Vector3.forward(), Vector3.up()),
    Vector3.up()
  );

  /**
   * A standard view that positions the camera facing the bottom-back of the
   * scene.
   */
  public static BOTTOM_BACK = new StandardView(
    Vector3.add(Vector3.forward(), Vector3.down()),
    Vector3.up()
  );

  /**
   * A standard view that positions the camera facing the back-left of the
   * scene.
   */
  public static BACK_LEFT = new StandardView(
    Vector3.add(Vector3.forward(), Vector3.right()),
    Vector3.up()
  );

  /**
   * A standard view that positions the camera facing the back-right of the
   * scene.
   */
  public static BACK_RIGHT = new StandardView(
    Vector3.add(Vector3.forward(), Vector3.left()),
    Vector3.up()
  );

  /**
   * A standard view that positions the camera facing the top-left of the scene.
   */
  public static TOP_LEFT = new StandardView(
    Vector3.add(Vector3.up(), Vector3.right()),
    Vector3.up()
  );

  /**
   * A standard view that positions the camera facing the top-right of the
   * scene.
   */
  public static TOP_RIGHT = new StandardView(
    Vector3.add(Vector3.up(), Vector3.left()),
    Vector3.up()
  );

  /**
   * A standard view that positions the camera facing the bottom-left of the
   * scene.
   */
  public static BOTTOM_LEFT = new StandardView(
    Vector3.add(Vector3.down(), Vector3.right()),
    Vector3.up()
  );

  /**
   * A standard view that positions the camera facing the bottom-right of the
   * scene.
   */
  public static BOTTOM_RIGHT = new StandardView(
    Vector3.add(Vector3.down(), Vector3.left()),
    Vector3.up()
  );

  public constructor(
    /**
     * The position vector of the standard view.
     */
    public readonly position: Vector3.Vector3,

    /**
     * The up vector of the standard view.
     */
    public readonly up: Vector3.Vector3
  ) {}

  /**
   * Returns a new standard view where the position and up vectors are
   * transformed with the given matrix.
   *
   * @param matrix A matrix.
   * @returns A new standard view.
   */
  public transformMatrix(matrix: Matrix4.Matrix4): StandardView {
    const newPosition = Vector3.transformMatrix(this.position, matrix);
    const newUp = Vector3.transformMatrix(this.up, matrix);
    return new StandardView(newPosition, newUp);
  }
}
