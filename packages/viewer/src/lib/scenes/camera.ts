import { BoundingBox, Vector3 } from '@vertexvis/geometry';
import { StreamApi } from '@vertexvis/stream-api';
import { UUID } from '@vertexvis/utils';

import { FrameDecoder } from '../mappers';
import { DEFAULT_TIMEOUT_IN_MS } from '../stream/dispatcher';
import {
  Animation,
  ClippingPlanes,
  FlyTo,
  FrameCamera,
  FrameCameraBase,
  FrameOrthographicCamera,
  FramePerspectiveCamera,
  StandardView,
} from '../types';
import { withPositionAndViewVector } from '../types/frameCamera';
import { CameraRenderResult } from './cameraRenderResult';
import { buildFlyToOperation } from './mapper';

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
export abstract class Camera {
  public constructor(
    protected stream: StreamApi,
    protected aspect: number,
    private data: FrameCamera.FrameCamera,
    protected boundingBox: BoundingBox.BoundingBox,
    protected decodeFrame: FrameDecoder,
    protected flyToOptions?: FlyTo.FlyToOptions
  ) {}

  protected fitCameraToBoundingBox(
    boundingBox: BoundingBox.BoundingBox,
    fovVertical: number,
    viewVector: Vector3.Vector3
  ): Camera {
    const radius =
      1.1 *
      Vector3.magnitude(
        Vector3.subtract(boundingBox.max, BoundingBox.center(boundingBox))
      );

    // ratio of the height of the frustum to the distance along the view vector
    let hOverD = Math.tan(fovVertical * PI_OVER_360);

    if (this.aspect < 1.0) {
      hOverD *= this.aspect;
    }

    const distance = Math.abs(radius / hOverD);
    const vvec = Vector3.scale(distance, Vector3.normalize(viewVector));

    const lookAt = BoundingBox.center(boundingBox);
    const position = Vector3.subtract(lookAt, vvec);

    return this.update({ lookAt, position, viewVector: vvec });
  }

  /**
   * Returns the distance from the camera's position to the center
   * of the provided bounding box (or the scene's visible bounding box if not provided).
   *
   * @param boundingBox - The bounding box to determine distance from.
   */
  public signedDistanceToBoundingBoxCenter(
    boundingBox?: BoundingBox.BoundingBox
  ): number {
    const { position, viewVector } = withPositionAndViewVector(this.data);

    const boundingBoxCenter = BoundingBox.center(
      boundingBox ?? this.boundingBox
    );
    const cameraToCenter = Vector3.subtract(position, boundingBoxCenter);

    return -(
      Vector3.dot(viewVector, cameraToCenter) / Vector3.magnitude(viewVector)
    );
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
      return this.updateFlyToOptions({
        flyTo: this.buildFlyToType(paramsOrQuery),
      });
    } else {
      return this.updateFlyToOptions(
        paramsOrQuery(new FlyToExecutor()).build()
      );
    }
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
          this.decodeFrame,
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
          camera: FrameCamera.toProtobuf(this.data),
          frameCorrelationId: { value: corrId },
        });

        return new CameraRenderResult(this.stream, this.decodeFrame, {
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
    return this.rotateAroundAxisAtPoint(angleInRadians, this.data.lookAt, axis);
  }

  /**
   * Updates the `position` and `up` vectors of the camera to the given standard
   * view.
   *
   * @param standardView The standard view to apply.
   * @returns A new camera.
   */
  public standardView(standardView: StandardView): Camera {
    return this.update({
      position: standardView.position,
      lookAt: Vector3.origin(),
      up: standardView.up,
    });
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

  protected computeClippingPlanes(
    camera: FrameCamera.FrameCamera
  ): ClippingPlanes.ClippingPlanes {
    return ClippingPlanes.fromBoundingBoxAndLookAtCamera(
      this.boundingBox,
      camera
    );
  }

  /**
   * Repositions the camera by rotating its current position around an axis
   * defined at a specific world point.
   *
   * @param angleInRadians The angle, in radians, to rotate.
   * @param point The point in world space to place the axis at.
   * @param axis A normalized vector to rotate around.
   */
  public abstract rotateAroundAxisAtPoint(
    angleInRadians: number,
    point: Vector3.Vector3,
    axis: Vector3.Vector3
  ): Camera;

  /**
   * Updates the position of the camera such that the given bounding box will
   * be contained within the camera's view.
   *
   * @param boundingBox The bounding box to position to.
   */
  public abstract fitToBoundingBox(
    boundingBox: BoundingBox.BoundingBox
  ): Camera;

  public abstract get position(): Vector3.Vector3;
  public abstract get lookAt(): Vector3.Vector3;
  public abstract get up(): Vector3.Vector3;
  public abstract get near(): number;
  public abstract get far(): number;
  public abstract get aspectRatio(): number;
  public abstract get viewVector(): Vector3.Vector3;

  /**
   * Shifts the position of the camera by the given delta.
   *
   * @param delta The number of units to shift the camera on the X, Y, and Z
   * axis.
   */
  public abstract moveBy(delta: Vector3.Vector3): Camera;

  /**
   * Updates the `position`, `lookAt` and/or `up` vectors of the camera.
   *
   * @param camera The values to update the camera to.
   */
  public abstract update(camera: Partial<FrameCamera.FrameCamera>): Camera;

  /**
   * Returns a `FrameCameraBase` representation.
   */
  public abstract toFrameCamera(): FrameCameraBase;

  protected abstract updateFlyToOptions(
    flyToOptions?: FlyTo.FlyToOptions
  ): Camera;
}

export class PerspectiveCamera
  extends Camera
  implements FrameCamera.PerspectiveFrameCamera
{
  public constructor(
    stream: StreamApi,
    aspect: number,
    private perspectiveData: FrameCamera.PerspectiveFrameCamera,
    boundingBox: BoundingBox.BoundingBox,
    decodeFrame: FrameDecoder,
    flyToOptions?: FlyTo.FlyToOptions
  ) {
    super(
      stream,
      aspect,
      perspectiveData,
      boundingBox,
      decodeFrame,
      flyToOptions
    );
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

  public fitToBoundingBox(boundingBox: BoundingBox.BoundingBox): Camera {
    return super.fitCameraToBoundingBox(
      boundingBox,
      this.fovY,
      this.viewVector
    );
  }

  public update(camera: Partial<FrameCamera.FrameCamera>): Camera {
    return new PerspectiveCamera(
      this.stream,
      this.aspect,
      { ...this.perspectiveData, ...camera },
      this.boundingBox,
      this.decodeFrame,
      this.flyToOptions
    );
  }

  public toFrameCamera(): FramePerspectiveCamera {
    return new FramePerspectiveCamera(
      this.position,
      this.lookAt,
      this.up,
      this.near,
      this.far,
      this.aspectRatio,
      this.fovY
    );
  }

  public get viewVector(): Vector3.Vector3 {
    return Vector3.subtract(this.lookAt, this.position);
  }

  /**
   * The position vector for the camera, in world space coordinates.
   */
  public get position(): Vector3.Vector3 {
    return { ...this.perspectiveData.position };
  }

  /**
   * A normalized vector representing the up direction.
   */
  public get up(): Vector3.Vector3 {
    return { ...this.perspectiveData.up };
  }

  /**
   * A vector, in world space coordinates, of where the camera is pointed at.
   */
  public get lookAt(): Vector3.Vector3 {
    return { ...this.perspectiveData.lookAt };
  }

  /**
   * The camera's field of view.
   */
  public get fovY(): number {
    return this.perspectiveData.fovY;
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
    const { near } = this.computeClippingPlanes(this.perspectiveData);
    return near;
  }

  /**
   * The camera's far clipping plane.
   */
  public get far(): number {
    const { far } = this.computeClippingPlanes(this.perspectiveData);
    return far;
  }

  protected updateFlyToOptions(
    flyToOptions?: FlyTo.FlyToOptions
  ): PerspectiveCamera {
    return new PerspectiveCamera(
      this.stream,
      this.aspect,
      this.perspectiveData,
      this.boundingBox,
      this.decodeFrame,
      flyToOptions
    );
  }
}

export class OrthographicCamera
  extends Camera
  implements FrameCamera.OrthographicFrameCamera
{
  public constructor(
    stream: StreamApi,
    aspect: number,
    private orthographicData: FrameCamera.OrthographicFrameCamera,
    boundingBox: BoundingBox.BoundingBox,
    decodeFrame: FrameDecoder,
    flyToOptions?: FlyTo.FlyToOptions
  ) {
    super(
      stream,
      aspect,
      orthographicData,
      boundingBox,
      decodeFrame,
      flyToOptions
    );
  }

  /**
   * Shifts the position of the camera by the given delta.
   *
   * @param delta The number of units to shift the camera on the X, Y, and Z
   * axis.
   */
  public moveBy(delta: Vector3.Vector3): Camera {
    const updatedLookAt = Vector3.add(this.lookAt, delta);

    return this.update({
      viewVector: Vector3.subtract(
        updatedLookAt,
        Vector3.add(this.position, delta)
      ),
      lookAt: updatedLookAt,
    });
  }

  public rotateAroundAxisAtPoint(
    angleInRadians: number,
    point: Vector3.Vector3,
    axis: Vector3.Vector3
  ): Camera {
    const newLookAt = Vector3.rotateAboutAxis(
      angleInRadians,
      this.lookAt,
      axis,
      point
    );
    const newUp = Vector3.rotateAboutAxis(
      angleInRadians,
      this.up,
      axis,
      Vector3.origin()
    );
    const newViewVector = Vector3.subtract(
      Vector3.rotateAboutAxis(angleInRadians, this.position, axis, point),
      newLookAt
    );

    return this.update({
      viewVector: newViewVector,
      lookAt: newLookAt,
      up: newUp,
    });
  }

  public fitToBoundingBox(boundingBox: BoundingBox.BoundingBox): Camera {
    return super.fitCameraToBoundingBox(
      boundingBox,
      this.fovHeight,
      this.viewVector
    );
  }

  public update(camera: Partial<FrameCamera.FrameCamera>): Camera {
    return new OrthographicCamera(
      this.stream,
      this.aspect,
      { ...this.orthographicData, ...camera },
      this.boundingBox,
      this.decodeFrame,
      this.flyToOptions
    );
  }

  public toFrameCamera(): FrameOrthographicCamera {
    return new FrameOrthographicCamera(
      this.viewVector,
      this.lookAt,
      this.up,
      this.near,
      this.far,
      this.aspectRatio,
      this.fovHeight
    );
  }

  public get viewVector(): Vector3.Vector3 {
    return { ...this.orthographicData.viewVector };
  }

  public get position(): Vector3.Vector3 {
    return Vector3.add(this.lookAt, Vector3.negate(this.viewVector));
  }

  /**
   * A normalized vector representing the up direction.
   */
  public get up(): Vector3.Vector3 {
    return { ...this.orthographicData.up };
  }

  /**
   * A vector, in world space coordinates, of where the camera is pointed at.
   */
  public get lookAt(): Vector3.Vector3 {
    return { ...this.orthographicData.lookAt };
  }

  /**
   * The camera's field of view.
   */
  public get fovHeight(): number {
    return this.orthographicData.fovHeight;
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
    const { near } = this.computeClippingPlanes(this.orthographicData);
    return near;
  }

  /**
   * The camera's far clipping plane.
   */
  public get far(): number {
    const { far } = this.computeClippingPlanes(this.orthographicData);
    return far;
  }

  protected updateFlyToOptions(
    flyToOptions?: FlyTo.FlyToOptions
  ): OrthographicCamera {
    return new OrthographicCamera(
      this.stream,
      this.aspect,
      this.orthographicData,
      this.boundingBox,
      this.decodeFrame,
      flyToOptions
    );
  }
}
