import { Animation, FrameCamera } from '../types';
import { Vector3, BoundingBox } from '@vertexvis/geometry';
import { RemoteRenderer } from '../rendering';

const PI_OVER_360 = 0.008726646259972;

/**
 * The `Camera` class contains properties that reflect a world space position, a
 * view direction (lookAt), and normalized vector representing the up direction.
 *
 * It also provides utility methods to update orientation of the camera and
 * rerender the scene.
 *
 * This class in intended to treated as an immutable type. Any mutations return
 * a new instance of the class with the updated properties.
 */
export class Camera implements FrameCamera.FrameCamera {

  public constructor(
    private renderer: RemoteRenderer,
    private aspect: number,
    private data: FrameCamera.FrameCamera
  ) {}

  /**
   * Updates the position of the camera such that the given bounding box will
   * be contained within the camera's view.
   *
   * @param boundingBox The bounding box to position to.
   */
  public fitToBoundingBox(boundingBox: BoundingBox.BoundingBox): Camera {
    const radius =
      1.1 *
      Vector3.magnitude(
        Vector3.subtract(boundingBox.max, BoundingBox.center(boundingBox))
      );

    // height (of scene?) over diameter
    let hOverD = Math.tan(this.fovY * PI_OVER_360);

    if (this.aspectRatio < 1.0) {
      hOverD *= this.aspectRatio;
    }

    const distance = Math.abs(radius / hOverD);
    const vvec = Vector3.scale(distance, Vector3.normalize(this.viewVector()));

    const lookAt = BoundingBox.center(boundingBox);
    const position = Vector3.subtract(lookAt, vvec);

    return this.update({ lookAt, position });
  }

  /**
   * Shifts the position of the camera by the given delta.
   *
   * @param delta The number of units to shift the camera on the X, Y, and Z
   * axis.
   */
  public moveBy(delta: Vector3.Vector3): Camera {
    return this.update({
      position: Vector3.add(this.position, delta),
      lookAt: Vector3.add(this.lookAt, delta),
    });
  }

  /**
   * Queues the rendering for a new frame using this camera. The returned
   * promise will resolve when a frame is received that contains this camera.
   */
  public async render(animation?: Animation.Animation): Promise<void> {
    try {
      await this.renderer({ camera: this.data, animation});
    } catch (e) {
      console.warn('Error when requesting new frame: ', e);
    }
  }

  /**
   * Repositions the camera by rotating its current position around an axis.
   *
   * @param angleInRadians The angle, in radians, to rotate.
   * @param axis A normalized vector to rotate around.
   */
  public rotateAroundAxis(
    angleInRadians: number,
    axis: Vector3.Vector3
  ): Camera {
    return this.update({
      position: Vector3.rotateAboutAxis(
        angleInRadians,
        this.position,
        axis,
        this.lookAt
      ),
      up: Vector3.rotateAboutAxis(
        angleInRadians,
        this.up,
        axis,
        Vector3.origin()
      ),
    });
  }

  /**
   * Updates the `position`, `lookAt` and/or `up` vectors of the camera.
   *
   * @param camera The values to update the camera to.
   */
  public update(camera: Partial<FrameCamera.FrameCamera>): Camera {
    return new Camera(this.renderer, this.aspectRatio, {
      ...this.data,
      ...camera,
    });
  }

  /**
   * Returns the view vector for the camera, which is the direction between the
   * `position` and `lookAt` vectors.
   */
  public viewVector(): Vector3.Vector3 {
    return Vector3.subtract(this.lookAt, this.position);
  }

  /**
   * The position vector for the camera, in world space coordinates.
   */
  public get position(): Vector3.Vector3 {
    return { ...this.data.position };
  }

  /**
   * A normalized vector representing the up direction.
   */
  public get up(): Vector3.Vector3 {
    return { ...this.data.up };
  }

  /**
   * A vector, in world space coordinates, of where the camera is pointed at.
   */
  public get lookAt(): Vector3.Vector3 {
    return { ...this.data.lookAt };
  }

  /**
   * The camera's field of view.
   */
  public get fovY(): number {
    return 45;
  }

  /**
   * The aspect ratio of the camera.
   */
  public get aspectRatio(): number {
    return this.aspect;
  }
}
