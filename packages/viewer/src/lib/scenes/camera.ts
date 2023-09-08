import {
  BoundingBox,
  BoundingSphere,
  Matrix4,
  Quaternion,
  Ray,
  Vector3,
} from '@vertexvis/geometry';
import { StreamApi } from '@vertexvis/stream-api';
import { UUID } from '@vertexvis/utils';

import { FrameDecoder } from '../mappers';
import { constrainViewVector } from '../rendering/vectors';
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

export interface CameraRenderOptions {
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
    distance: number,
    viewVector: Vector3.Vector3
  ): Camera {
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
    const cameraToCenter = Vector3.subtract(boundingBoxCenter, position);

    return (
      Vector3.dot(viewVector, cameraToCenter) / Vector3.magnitude(viewVector)
    );
  }

  /**
   * Specifies that the next render of the camera will be repositioned to one of
   * the options specified in `options`.
   *
   * @example
   * ```typescript
   * const viewer = document.querySelector("vertex-viewer");
   * const scene = await viewer.scene();
   * const camera = scene.camera();
   *
   * // Fly to and fit to a specific item by ID with an animation of 1 second
   * await camera
   *   .flyTo({ itemId: "item-id" })
   *   .render({ animation: { milliseconds: 1000 } });
   *
   * // Fly to and fit to a specific item by supplied ID with an animation of 1 second
   * await camera
   *   .flyTo({ itemSuppliedId: "item-supplied-id" })
   *   .render({ animation: { milliseconds: 1000 } });
   *
   * // Fly to and fit to the bounding box of the current set of selected items
   * // with an animation of 1 second
   * await camera
   *   .flyTo({
   *     boundingBox:
   *       viewer.frame.scene.sceneViewSummary.selectedVisibleSummary.boundingBox,
   *   })
   *   .render({ animation: { milliseconds: 1000 } });
   *
   * // Fly to a specific camera
   * await camera
   *   .flyTo({
   *     camera: {
   *       position: {
   *         x: 1,
   *         y: 2,
   *         z: 3,
   *       },
   *       lookAt: {
   *         x: 0,
   *         y: 0,
   *         z: 0,
   *       },
   *       up: {
   *         x: 0,
   *         y: 1,
   *         z: 0,
   *       },
   *     },
   *   })
   *   .render({ animation: { milliseconds: 1000 } });
   * ```
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

  /**
   * Performs a `flyTo` operation with the current visible bounding box of
   * the scene.
   *
   * @example
   * ```typescript
   * const viewer = document.querySelector('vertex-viewer');
   * const scene = await viewer.scene();
   * const camera = scene.camera();
   *
   * // Fit to the visible bounding box of the scene with an animation of 1 second
   * await camera.viewAll().render({ animation: { milliseconds: 1000 } });
   * ```
   */
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
   * Repositions the camera by rotating its current position around an axis placed
   * at the `lookAt` point. This method internally will call {@link Camera.rotateAroundAxisAtPoint}
   * with the `point` parameter set to the current `lookAt` point.
   *
   * @see {@link Camera.rotateAroundAxisAtPoint} for more information.
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
   * Aligns the camera to the plane defined by the provided position and normal.
   * This will place the camera at the provided position, set the up vector to
   * the provided normal, and place the lookAt on the defined plane. The point
   * chosen for the lookAt will be determined using the current view vector.
   *
   * @example
   * ```typescript
   * const viewer = document.querySelector("vertex-viewer");
   *
   * viewer.addEventListener("tap", async (event) => {
   *   const scene = await viewer.scene();
   *   const raycaster = scene.raycaster();
   *
   *   const [hit] = await raycaster.hitItems(event.detail.position);
   *
   *   if (hit != null) {
   *     const camera = scene.camera();
   *
   *     // Align to the plane represented by the hit result with an animation of 1 second
   *     await camera
   *       .alignTo(hit.hitPoint, hit.hitNormal)
   *       .render({ animation: { milliseconds: 1000 } });
   *   }
   * });
   * ```
   *
   * @param position The position to place the camera at.
   * @param normal The normal of the plane to align to.
   */
  public alignTo(position: Vector3.Vector3, normal: Vector3.Vector3): Camera {
    const worldX = Vector3.normalize(
      Vector3.cross(this.up, Vector3.normalize(this.viewVector))
    );
    const positiveWorldY = Vector3.normalize(
      Vector3.cross(Vector3.normalize(this.viewVector), worldX)
    );

    // Invert the world y axis if the provided normal is more than 90 degrees from it
    // to compute a proper angle to rotate the view vector by
    const worldY =
      Vector3.angleTo(normal, positiveWorldY) > Math.PI / 2
        ? Vector3.negate(positiveWorldY)
        : positiveWorldY;
    const localX = Vector3.isEqual(worldY, normal)
      ? worldX
      : Vector3.normalize(Vector3.cross(worldY, normal));

    const transformedViewVector = Vector3.transformMatrix(
      this.viewVector,
      Matrix4.makeRotation(
        Quaternion.fromAxisAngle(localX, Vector3.angleTo(normal, worldY))
      )
    );
    const lookAtRay = Ray.create({
      origin: position,
      direction: Vector3.normalize(transformedViewVector),
    });
    const lookAt = Ray.at(lookAtRay, Vector3.magnitude(this.viewVector));

    return this.update({
      position,
      lookAt,
      up: normal,
    });
  }

  /**
   * Updates the `position` and `up` vectors of the camera to the given standard
   * view.
   *
   * @see {@link StandardView} for the available standard views.
   *
   * @param standardView The standard view to apply.
   * @returns A new camera.
   */
  public standardView(standardView: StandardView): Camera {
    return this.update({
      position: standardView.position,
      viewVector: Vector3.subtract(Vector3.origin(), standardView.position),
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
   * @example
   * ```typescript
   * const viewer = document.querySelector('vertex-viewer');
   *
   * viewer.addEventListener('tap', async (event) => {
   *   const scene = await viewer.scene();
   *   const raycaster = scene.raycaster();
   *
   *   const [hit] = await raycaster.hitItems(event.detail.position);
   *
   *   if (hit != null) {
   *     const camera = scene.camera();
   *
   *     // Using the current `up` vector of the camera, rotate 45 degrees
   *     // about the hit position with an animation of 1 second
   *     await camera.rotateAroundAxisAtPoint(
   *       Angle.toRadians(45),
   *       hit.hitPoint,
   *       camera.up,
   *     ).render({ animation: { milliseconds: 1000 } });
   *   }
   * });
   * ```
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
   * Updates the `position`, `lookAt` and/or `up` vectors of the camera. Each
   * vector can be omitted in the payload, and the resulting camera will keep
   * the previous `position`, `lookAt`, or `up` vectors.
   *
   * @example
   * ```typescript
   * const viewer = document.querySelector("vertex-viewer");
   * const scene = await viewer.scene();
   * const camera = scene.camera();
   *
   * // Update the camera to place it at the origin
   * await camera
   *   .update({
   *     position: {
   *       x: 0,
   *       y: 0,
   *       z: 0,
   *     },
   *   })
   *   .render({ animation: { milliseconds: 1000 } });
   *
   * // Update the camera to look at the origin
   * await camera
   *   .update({
   *     lookAt: {
   *       x: 0,
   *       y: 0,
   *       z: 0,
   *     },
   *   })
   *   .render({ animation: { milliseconds: 1000 } });
   * ```
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
    const radius =
      1.1 *
      Vector3.magnitude(
        Vector3.subtract(boundingBox.max, BoundingBox.center(boundingBox))
      );

    // ratio of the height of the frustum to the distance along the view vector
    let hOverD = Math.tan((this.fovY ?? 45) * PI_OVER_360);

    if (this.aspect < 1.0) {
      hOverD *= this.aspect;
    }

    const distance = Math.abs(radius / hOverD);

    return super.fitCameraToBoundingBox(boundingBox, distance, this.viewVector);
  }

  public update(camera: Partial<FrameCamera.PerspectiveFrameCamera>): Camera {
    const fovY = camera.fovY ?? this.fovY;
    return new PerspectiveCamera(
      this.stream,
      this.aspect,
      { ...this.perspectiveData, ...camera, fovY },
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
      this.fovY ?? 45
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
  public get fovY(): number | undefined {
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
    return this.update({
      lookAt: Vector3.add(this.lookAt, delta),
    });
  }

  public rotateAroundAxisAtPoint(
    angleInRadians: number,
    point: Vector3.Vector3,
    axis: Vector3.Vector3
  ): Camera {
    const updatedLookAt = Vector3.rotateAboutAxis(
      angleInRadians,
      this.lookAt,
      axis,
      point
    );
    const updatedPosition = Vector3.rotateAboutAxis(
      angleInRadians,
      this.position,
      axis,
      point
    );
    const viewVector = constrainViewVector(
      Vector3.subtract(updatedLookAt, updatedPosition),
      BoundingSphere.create(this.boundingBox)
    );

    return this.update({
      viewVector: viewVector,
      lookAt: updatedLookAt,
      up: Vector3.rotateAboutAxis(
        angleInRadians,
        this.up,
        axis,
        Vector3.origin()
      ),
    });
  }

  public fitToBoundingBox(boundingBox: BoundingBox.BoundingBox): Camera {
    const boundingSphere = BoundingSphere.create(boundingBox);

    const fitAll = super.fitCameraToBoundingBox(
      boundingBox,
      boundingSphere.radius,
      this.viewVector
    );

    return this.update({
      lookAt: fitAll.lookAt,
      viewVector: fitAll.viewVector,
      fovHeight: boundingSphere.radius * 2,
    });
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
      constrainViewVector(
        this.viewVector,
        BoundingSphere.create(this.boundingBox)
      ),
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
