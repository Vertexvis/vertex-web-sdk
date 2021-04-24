import { Animation, FlyTo, FrameCamera } from '../types';
import { Vector3, BoundingBox } from '@vertexvis/geometry';
import { StreamApi } from '@vertexvis/stream-api';
import { UUID } from '@vertexvis/utils';
import { buildFlyToOperation } from '../commands/streamCommandsMapper';
import { CameraRenderResult } from './cameraRenderResult';
import { DEFAULT_TIMEOUT_IN_MS } from '../stream/dispatcher';

const PI_OVER_360 = 0.008726646259972;

interface CameraRenderOptions {
  animation?: Animation.Animation;
}

interface ClippingPlanes {
  near: number;
  far: number;
}

export class TerminalFlyToExecutor {
  public constructor(private flyToOptions?: FlyTo.FlyToOptions) {}

  public build(): FlyTo.FlyToOptions | undefined {
    return this.flyToOptions;
  }
}

export class FlyToExecutor {
  private flyToOptions?: FlyTo.FlyToOptions;

  public withItemId(id: string): TerminalFlyToExecutor {
    return new TerminalFlyToExecutor({
      flyTo: {
        type: 'internal',
        data: id,
      },
    });
  }

  public withSuppliedId(id: string): TerminalFlyToExecutor {
    return new TerminalFlyToExecutor({
      flyTo: {
        type: 'supplied',
        data: id,
      },
    });
  }

  public withCamera(camera: FrameCamera.FrameCamera): TerminalFlyToExecutor {
    return new TerminalFlyToExecutor({
      flyTo: {
        type: 'camera',
        data: camera,
      },
    });
  }

  public withBoundingBox(
    boundingBox: BoundingBox.BoundingBox
  ): TerminalFlyToExecutor {
    return new TerminalFlyToExecutor({
      flyTo: {
        type: 'bounding-box',
        data: boundingBox,
      },
    });
  }

  public build(): FlyTo.FlyToOptions | undefined {
    return this.flyToOptions;
  }
}

export interface FlyToParams {
  itemId?: string;
  camera?: FrameCamera.FrameCamera;
  boundingBox?: BoundingBox.BoundingBox;
  itemSuppliedId?: string;
}

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
  private flyToOptions?: FlyTo.FlyToOptions;

  public constructor(
    private stream: StreamApi,
    private aspect: number,
    private data: FrameCamera.FrameCamera,
    private boundingBox: BoundingBox.BoundingBox
  ) {}

  /**
   * Updates the position of the camera such that the given bounding box will
   * be contained within the camera's view.
   *
   * @param boundingBox The bounding box to position to.
   */
  public fitToBoundingBox(boundingBox: BoundingBox.BoundingBox): Camera {
    return this.update(this.positionAtBoundingBox(boundingBox));
  }

  /**
   * Returns the distance from the provided camera's position to the center
   * of the provided bounding box (or the scene's visible bounding box if not provided).
   *
   * @param camera - The camera to use.
   * @param boundingBox - The bounding box to determine distance from.
   */
  public distanceToBoundingBoxCenter(
    camera: FrameCamera.FrameCamera,
    boundingBox?: BoundingBox.BoundingBox
  ): number {
    const box = boundingBox || this.boundingBox;
    const boundingBoxCenter = BoundingBox.center(box);
    const cameraToCenter = Vector3.subtract(camera.position, boundingBoxCenter);

    const distanceToCenterAlongViewVec =
      Math.abs(
        Vector3.dot(
          Vector3.subtract(camera.lookAt, camera.position),
          cameraToCenter
        )
      ) / Vector3.magnitude(Vector3.subtract(camera.lookAt, camera.position));

    return distanceToCenterAlongViewVec;
  }

  /**
   * Specifies that the next render of the camera will be repositioned to one of
   * the options specified in `options`.
   *
   * @param paramsOrQuery An object or query describing how the camera should
   * be positioned.
   */
  public flyTo(
    paramsOrQuery: FlyToParams | ((q: FlyToExecutor) => TerminalFlyToExecutor)
  ): Camera {
    if (typeof paramsOrQuery !== 'function') {
      this.flyToOptions = { flyTo: this.buildFlyToType(paramsOrQuery) };
      return this;
    } else {
      this.flyToOptions = paramsOrQuery(new FlyToExecutor()).build();
      return this;
    }
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

  public viewAll(): Camera {
    return this.fitToBoundingBox(this.boundingBox);
  }

  /**
   * Queues the rendering for a new frame using this camera. The returned
   * promise will resolve when a frame is received that contains this camera.
   */
  public async render(
    renderOptions?: CameraRenderOptions
  ): Promise<CameraRenderResult> {
    if (this.flyToOptions == null && renderOptions != null) {
      this.flyToOptions = {
        flyTo: {
          type: 'camera',
          data: this.data,
        },
      };
    }

    try {
      const corrId = UUID.create();
      if (this.flyToOptions != null) {
        const payload = buildFlyToOperation(
          corrId,
          this.flyToOptions,
          renderOptions?.animation
        );
        const flyToResponse = await this.stream.flyTo(payload, true);

        return new CameraRenderResult(
          this.stream,
          {
            correlationId: corrId,
            animationId: flyToResponse.flyTo?.animationId?.hex || undefined,
          },
          renderOptions?.animation?.milliseconds != null
            ? renderOptions.animation.milliseconds + DEFAULT_TIMEOUT_IN_MS
            : undefined
        );
      } else {
        this.stream.replaceCamera({
          camera: this.data,
          frameCorrelationId: { value: corrId },
        });

        return new CameraRenderResult(this.stream, {
          correlationId: corrId,
        });
      }
    } catch (e) {
      console.warn('Error when performing render: ', e);
      throw e;
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

  public rotateAroundAxisAtPoint(
    angleInRadians: number,
    point: Vector3.Vector3,
    axis: Vector3.Vector3
  ): Camera {
    return this.update({
      position: Vector3.rotateAboutAxis(
        angleInRadians,
        this.position,
        axis,
        point
      ),
      lookAt: Vector3.rotateAboutAxis(angleInRadians, this.lookAt, axis, point),
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
    return new Camera(
      this.stream,
      this.aspectRatio,
      {
        ...this.data,
        ...camera,
      },
      this.boundingBox
    );
  }

  private buildFlyToType(options: FlyToParams): FlyTo.FlyToType {
    if (options.boundingBox != null) {
      return { type: 'bounding-box', data: options.boundingBox };
    } else if (options.camera != null) {
      return { type: 'camera', data: options.camera };
    } else if (options.itemId != null) {
      return { type: 'internal', data: options.itemId };
    } else if (options.itemSuppliedId != null) {
      return { type: 'supplied', data: options.itemSuppliedId };
    } else {
      throw new Error('Fly to must specify at least one option.');
    }
  }

  private computeClippingPlanes(
    camera: FrameCamera.FrameCamera
  ): ClippingPlanes {
    const boundingBoxCenter = BoundingBox.center(this.boundingBox);
    const cameraToCenter = Vector3.subtract(camera.position, boundingBoxCenter);
    const centerToBoundingPlane = Vector3.subtract(
      this.boundingBox.max,
      boundingBoxCenter
    );
    const distanceToCenterAlongViewVec =
      Math.abs(
        Vector3.dot(
          Vector3.subtract(camera.lookAt, camera.position),
          cameraToCenter
        )
      ) / Vector3.magnitude(Vector3.subtract(camera.lookAt, camera.position));
    const radius = 1.1 * Vector3.magnitude(centerToBoundingPlane);
    let far = distanceToCenterAlongViewVec + radius;
    let near = far * 0.01;

    if (near > distanceToCenterAlongViewVec - radius) {
      if (near > 1000) {
        const difference = near - 1000;
        near = 1000;
        far -= difference;
      } else {
      }
    } else {
      near = distanceToCenterAlongViewVec - radius;
    }

    return { far, near };
  }

  private positionAtBoundingBox(
    boundingBox: BoundingBox.BoundingBox
  ): FrameCamera.FrameCamera {
    const radius =
      1.1 *
      Vector3.magnitude(
        Vector3.subtract(boundingBox.max, BoundingBox.center(boundingBox))
      );

    // ratio of the height of the frustum to the distance along the view vector
    let hOverD = Math.tan(this.fovY * PI_OVER_360);

    if (this.aspectRatio < 1.0) {
      hOverD *= this.aspectRatio;
    }

    const distance = Math.abs(radius / hOverD);
    const vvec = Vector3.scale(distance, Vector3.normalize(this.viewVector()));

    const lookAt = BoundingBox.center(boundingBox);
    const position = Vector3.subtract(lookAt, vvec);

    return { lookAt, position, up: this.up };
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
   * The position vector for the camera when fit to the visible bounding box,
   * in world space coordinates.
   */
  public get positionFitAll(): Vector3.Vector3 {
    return { ...this.fitToBoundingBox(this.boundingBox).position };
  }

  /**
   * A normalized vector representing the up direction.
   */
  public get up(): Vector3.Vector3 {
    return { ...this.data.up };
  }

  /**
   * The up (see `camera.up`) vector for the camera when fit to the visible bounding box,
   * in world space coordinates.
   */
  public get upFitAll(): Vector3.Vector3 {
    return { ...this.fitToBoundingBox(this.boundingBox).up };
  }

  /**
   * A vector, in world space coordinates, of where the camera is pointed at.
   */
  public get lookAt(): Vector3.Vector3 {
    return { ...this.data.lookAt };
  }

  /**
   * The lookAt (see `camera.lookAt`) vector for the camera when fit to the visible bounding box,
   * in world space coordinates.
   */
  public get lookAtFitAll(): Vector3.Vector3 {
    return { ...this.fitToBoundingBox(this.boundingBox).lookAt };
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

  /**
   * The camera's near clipping plane.
   */
  public get near(): number {
    const { near } = this.computeClippingPlanes(this.data);

    return near;
  }

  /**
   * The camera's near clipping plane when fit to the visible
   * bounding box.
   */
  public get nearFitAll(): number {
    const { near } = this.computeClippingPlanes(
      this.positionAtBoundingBox(this.boundingBox)
    );
    return near;
  }

  /**
   * The camera's far clipping plane.
   */
  public get far(): number {
    const { far } = this.computeClippingPlanes(this.data);

    return far;
  }

  /**
   * The camera's far clipping plane when fit to the visible
   * bounding box.
   */
  public get farFitAll(): number {
    const { far } = this.computeClippingPlanes(
      this.positionAtBoundingBox(this.boundingBox)
    );
    return far;
  }
}
