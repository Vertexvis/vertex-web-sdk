import { Animation, FlyTo, FrameCamera } from '../types';
import { Vector3, BoundingBox, Matrix4, Angle } from '@vertexvis/geometry';
import { StreamApi } from '@vertexvis/stream-api';
import { UUID } from '@vertexvis/utils';
import { buildFlyToOperation } from '../commands/streamCommandsMapper';
import { CameraRenderResult } from './cameraRenderResult';
import { DEFAULT_TIMEOUT_IN_MS } from '../stream/dispatcher';

const PI_OVER_360 = 0.008726646259972;

interface CameraRenderOptions {
  animation?: Animation.Animation;
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
  private cameraNear: number = 0;
  private cameraFar: number = 0;

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
    const distance = this.getDistanceToBoundingBoxFarEdge();
    const vvec = Vector3.scale(distance, Vector3.normalize(this.viewVector()));

    const lookAt = BoundingBox.center(boundingBox);
    const position = Vector3.subtract(lookAt, vvec);

    return this.update({ lookAt, position });
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

  private getBoundingBoxRadius(): number {
    return (
      1.1 *
      Vector3.magnitude(
        Vector3.subtract(
          this.boundingBox.max,
          BoundingBox.center(this.boundingBox)
        )
      )
    );
  }

  private getDistanceToBoundingBoxFarEdge(): number {
    const radius = this.getBoundingBoxRadius();

    // height (of scene?) over diameter
    let hOverD = Math.tan(Angle.toRadians(this.fovY) / 2.0);

    if (this.aspectRatio < 1.0) {
      hOverD *= this.aspectRatio;
    }

    return Math.abs(radius / hOverD);
  }

  private computeClippingPlanes(): void {
    const boundingBoxCenter = BoundingBox.center(this.boundingBox);
    const cameraToCenter = Vector3.subtract(this.position, boundingBoxCenter);
    const centerToBoundingPlane = Vector3.subtract(
      this.boundingBox.max,
      boundingBoxCenter
    );
    const distanceToCenterAlongViewVec =
      Math.abs(Vector3.dot(this.viewVector(), cameraToCenter)) /
      Vector3.magnitude(this.viewVector());
    const radius = 1.1 * Vector3.magnitude(centerToBoundingPlane);
    this.cameraFar = distanceToCenterAlongViewVec + radius;
    this.cameraNear = this.cameraFar * 0.01;

    if (this.cameraNear > distanceToCenterAlongViewVec - radius) {
      if (this.cameraNear > 1000) {
        const difference = this.cameraNear - 1000;
        this.cameraNear = 1000;
        this.cameraFar -= difference;
      }
    } else {
      this.cameraNear = distanceToCenterAlongViewVec - radius;
    }
  }

  /**
   * Returns the view vector for the camera, which is the direction between the
   * `position` and `lookAt` vectors.
   */
  public viewVector(): Vector3.Vector3 {
    return Vector3.subtract(this.lookAt, this.position);
  }

  public projectionMatrix(): Matrix4.Matrix4 {
    const near = this.near;
    const far = this.far;
    const fovY = this.fovY;

    const ymax = near * Math.tan(Angle.toRadians(fovY / 2.0));
    const xmax = ymax * this.aspect;

    const left = -xmax;
    const right = xmax;
    const bottom = -ymax;
    const top = ymax;

    return Matrix4.create([
      (2.0 * near) / (right - left),
      0,
      0,
      0,
      0,
      (2.0 * near) / (top - bottom),
      0,
      0,
      0,
      0,
      -(far + near) / (far - near),
      -(2.0 * near * far) / (far - near),
      0,
      0,
      -1.0,
      0,
    ]);
  }

  public inverseProjectionMatrix(): Matrix4.Matrix4 {
    const near = this.near;
    const far = this.far;
    const fovY = this.fovY;

    const ymax = near * Math.tan(Angle.toRadians(fovY / 2.0));
    const xmax = ymax * this.aspect;

    const left = -xmax;
    const right = xmax;
    const bottom = -ymax;
    const top = ymax;

    return Matrix4.create([
      (right - left) / (2 * near),
      0,
      0,
      0,
      0,
      (top - bottom) / (2 * near),
      0,
      0,
      0,
      0,
      0,
      -1,

      0,
      0,
      -(far - near) / (2 * far * near),
      (far + near) / (2 * far * near),
    ]);
  }

  public viewMatrix(): Matrix4.Matrix4 {
    const flippedViewVector = Vector3.scale(-1, this.viewVector());
    const sideVector = Vector3.normalize(
      Vector3.cross(this.up, flippedViewVector)
    );
    const upVector = Vector3.normalize(
      Vector3.cross(flippedViewVector, sideVector)
    );
    const forwardVector = Vector3.normalize(flippedViewVector);
    const offset = Vector3.scale(
      -1.0,
      Vector3.add(this.lookAt, flippedViewVector)
    );

    return Matrix4.create([
      sideVector.x,
      sideVector.y,
      sideVector.z,
      sideVector.x * offset.x +
        sideVector.y * offset.y +
        sideVector.z * offset.z,
      upVector.x,
      upVector.y,
      upVector.z,
      upVector.x * offset.x + upVector.y * offset.y + upVector.z * offset.z,
      forwardVector.x,
      forwardVector.y,
      forwardVector.z,
      forwardVector.x * offset.x +
        forwardVector.y * offset.y +
        forwardVector.z * offset.z,
      0.0,
      0.0,
      0.0,
      1.0,
    ]);
  }

  public inverseViewMatrix(): Matrix4.Matrix4 {
    const flippedViewVector = Vector3.scale(-1, this.viewVector());
    const sideVector = Vector3.normalize(
      Vector3.cross(this.up, flippedViewVector)
    );
    const upVector = Vector3.normalize(
      Vector3.cross(flippedViewVector, sideVector)
    );
    const forwardVector = Vector3.normalize(flippedViewVector);
    const offset = Vector3.scale(
      -1,
      Vector3.add(this.lookAt, flippedViewVector)
    );

    const rotationTranspose = Matrix4.create([
      sideVector.x,
      upVector.x,
      forwardVector.x,
      0,
      sideVector.y,
      upVector.y,
      forwardVector.y,
      0,
      sideVector.z,
      upVector.z,
      forwardVector.z,
      0,
      0,
      0,
      0,
      1.0,
    ]);

    const translation = Matrix4.multiplyVector3(
      rotationTranspose,
      Vector3.create(
        sideVector.x * offset.x +
          sideVector.y * offset.y +
          sideVector.z * offset.z,
        upVector.x * offset.x + upVector.y * offset.y + upVector.z * offset.z,
        forwardVector.x * offset.x +
          forwardVector.y * offset.y +
          forwardVector.z * offset.z
      )
    );

    return Matrix4.create([
      sideVector.x,
      upVector.x,
      forwardVector.x,
      -translation.x,
      sideVector.y,
      upVector.y,
      forwardVector.y,
      -translation.y,
      sideVector.z,
      upVector.z,
      forwardVector.z,
      -translation.z,
      0,
      0,
      0,
      1.0,
    ]);
  }

  public viewProjectionMatrix(): Matrix4.Matrix4 {
    return Matrix4.multiply(this.projectionMatrix(), this.viewMatrix());
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

  /**
   * The camera's near clipping plane.
   */
  public get near(): number {
    this.computeClippingPlanes();

    return this.cameraNear;
  }
  /**
   * The camera's far clipping plane.
   */
  public get far(): number {
    this.computeClippingPlanes();

    return this.cameraFar;
  }
}
