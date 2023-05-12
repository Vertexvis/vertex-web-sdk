import {
  BoundingBox,
  BoundingSphere,
  Dimensions,
  Line3,
  Matrix4,
  Plane,
  Rectangle,
  Vector3,
} from '@vertexvis/geometry';
import { UUID } from '@vertexvis/utils';

import { decodePng } from '../../workers/png-decoder-pool';
import { constrainViewVector } from '../rendering/vectors';
import * as ClippingPlanes from './clippingPlanes';
import * as CrossSectioning from './crossSectioning';
import { DepthBuffer } from './depthBuffer';
import * as DisplayListSummary from './displayListSummary';
import { FeatureMap } from './featureMap';
import * as FrameCamera from './frameCamera';
import { Orientation } from './orientation';

export class Frame {
  private cachedDepthBuffer?: Promise<DepthBuffer | undefined>;
  private cachedFeatureMap?: Promise<FeatureMap | undefined>;

  public constructor(
    public readonly correlationIds: string[],
    public readonly sequenceNumber: number,
    public readonly dimensions: Dimensions.Dimensions,
    public readonly image: FrameImage,
    public readonly scene: FrameScene,
    private readonly depthBufferBytes: Uint8Array | undefined,
    private readonly featureMapBytes: Uint8Array | undefined,
    private readonly id = UUID.create()
  ) {}

  public getId(): UUID.UUID {
    return this.id;
  }

  public async depthBuffer(): Promise<DepthBuffer | undefined> {
    if (this.cachedDepthBuffer == null) {
      this.cachedDepthBuffer =
        this.depthBufferBytes != null
          ? this.decodeDepthBuffer(new Uint8Array(this.depthBufferBytes))
          : Promise.resolve(undefined);
    }
    return this.cachedDepthBuffer;
  }

  private async decodeDepthBuffer(bytes: Uint8Array): Promise<DepthBuffer> {
    const png = await decodePng(bytes);
    return DepthBuffer.fromPng(png, this.scene.camera, this.image.imageAttr);
  }

  public async featureMap(): Promise<FeatureMap | undefined> {
    if (this.cachedFeatureMap == null) {
      this.cachedFeatureMap =
        this.featureMapBytes != null
          ? this.decodeFeatureMap(new Uint8Array(this.featureMapBytes))
          : Promise.resolve(undefined);
    }
    return this.cachedFeatureMap;
  }

  private async decodeFeatureMap(bytes: Uint8Array): Promise<FeatureMap> {
    const png = await decodePng(bytes);
    return FeatureMap.fromPng(png, this.image.imageAttr);
  }

  public copy({
    correlationIds,
    sequenceNumber,
    dimensions,
    image,
    scene,
    depthBufferBytes,
    featureMapBytes,
  }: {
    correlationIds?: string[];
    sequenceNumber?: number;
    dimensions?: Dimensions.Dimensions;
    image?: FrameImage;
    scene?: FrameScene;
    depthBufferBytes?: Uint8Array;
    featureMapBytes?: Uint8Array;
  }): Frame {
    return new Frame(
      correlationIds ?? this.correlationIds,
      sequenceNumber ?? this.sequenceNumber,
      dimensions ?? this.dimensions,
      image ?? this.image,
      scene ?? this.scene,
      depthBufferBytes ?? this.depthBufferBytes,
      featureMapBytes ?? this.featureMapBytes,
      this.id
    );
  }
}

export interface FrameImageLike {
  readonly imageAttr: ImageAttributesLike;
}

export interface ImageAttributesLike {
  readonly frameDimensions: Dimensions.Dimensions;
  readonly imageRect: Rectangle.Rectangle;
  readonly imageScale: number;
}

export class FrameImage implements FrameImageLike {
  public constructor(
    public readonly imageAttr: ImageAttributesLike,
    public readonly imageBytes: Uint8Array
  ) {}
}

export class FrameScene {
  public constructor(
    public readonly camera: FrameCameraBase,
    public readonly boundingBox: BoundingBox.BoundingBox,
    public readonly crossSection: CrossSectioning.CrossSectioning,
    public readonly worldOrientation: Orientation,
    public readonly hasChanged: boolean,
    public readonly displayListSummary: DisplayListSummary.DisplayListSummary
  ) {}
}

interface FrameCameraMatrices {
  readonly projectionMatrix: Matrix4.Matrix4;
  readonly projectionMatrixInverse: Matrix4.Matrix4;
  readonly worldMatrix: Matrix4.Matrix4;
  readonly viewMatrix: Matrix4.Matrix4;
  readonly projectionViewMatrix: Matrix4.Matrix4;
}

interface FrameCameraLike {
  readonly position: Vector3.Vector3;
  readonly lookAt: Vector3.Vector3;
  readonly up: Vector3.Vector3;
  readonly near: number;
  readonly far: number;
  readonly aspectRatio: number;
}

interface FramePerspectiveCameraLike {
  readonly fovY: number;
}

interface FrameOrthographicCameraLike {
  readonly fovHeight: number;
  readonly top: number;
  readonly bottom: number;
  readonly right: number;
  readonly left: number;
}

export class FrameCameraBase implements FrameCameraLike {
  protected cameraMatrices?: FrameCameraMatrices;

  public constructor(
    public readonly position: Vector3.Vector3,
    public readonly lookAt: Vector3.Vector3,
    public readonly up: Vector3.Vector3,
    public readonly near: number,
    public readonly far: number,
    public readonly aspectRatio: number
  ) {}

  public get direction(): Vector3.Vector3 {
    return Vector3.normalize(this.viewVector);
  }

  public get viewVector(): Vector3.Vector3 {
    return Vector3.subtract(this.lookAt, this.position);
  }

  public get worldMatrix(): Matrix4.Matrix4 {
    return this.computeCameraMatrices().worldMatrix;
  }

  public get viewMatrix(): Matrix4.Matrix4 {
    return this.computeCameraMatrices().viewMatrix;
  }

  public get projectionMatrix(): Matrix4.Matrix4 {
    return this.computeCameraMatrices().projectionMatrix;
  }

  public get projectionMatrixInverse(): Matrix4.Matrix4 {
    return this.computeCameraMatrices().projectionMatrixInverse;
  }

  public get projectionViewMatrix(): Matrix4.Matrix4 {
    return this.computeCameraMatrices().projectionViewMatrix;
  }

  public get frustumProjectionViewMatrix(): Matrix4.Matrix4 {
    return this.computeCameraMatrices().projectionViewMatrix;
  }

  public static fromBoundingBox(
    camera: FrameCamera.FrameCamera,
    boundingBox: BoundingBox.BoundingBox,
    aspectRatio: number
  ): FrameCameraBase {
    const { near, far } = ClippingPlanes.fromBoundingBoxAndLookAtCamera(
      boundingBox,
      camera
    );

    if (FrameCamera.isOrthographicFrameCamera(camera)) {
      return new FrameOrthographicCamera(
        constrainViewVector(
          camera.viewVector,
          BoundingSphere.create(boundingBox)
        ),
        camera.lookAt,
        camera.up,
        near,
        far,
        aspectRatio,
        camera.fovHeight
      );
    } else {
      return new FramePerspectiveCamera(
        camera.position,
        camera.lookAt,
        camera.up,
        near,
        far,
        aspectRatio,
        camera.fovY ?? 45
      );
    }
  }

  /**
   * Returns whether this `FrameCameraBase` is an orthographic camera.
   */
  public isOrthographic(): this is FrameOrthographicCamera {
    return false;
  }

  /**
   * Returns whether this `FrameCameraBase` is a perspective camera.
   */
  public isPerspective(): this is FramePerspectiveCamera {
    return false;
  }

  /**
   * Checks if the given point, in world space, is behind the near plane
   * of the camera.
   *
   * @param world A point in world space.
   * @returns `true` if the point is behind the camera.
   */
  public isPointBehindNear(world: Vector3.Vector3): boolean {
    const { position, direction, near } = this;
    const dist = Vector3.dot(Vector3.subtract(world, position), direction);
    return dist < near;
  }

  /**
   * Returns a point on the near plane that intersects with `line`. If `line`
   * does not intersect, then `undefined` is returned.
   *
   * @param line The line to intersect.
   * @returns A point in world space, or `undefined` if the line does not
   * intersect with the near plane.
   */
  public intersectLineWithNear(line: Line3.Line3): Vector3.Vector3 | undefined {
    const { position, direction, near } = this;

    const vs = Vector3.subtract(line.start, position);
    const ve = Vector3.subtract(line.end, position);
    const vl = Line3.create({ start: vs, end: ve });

    const nearP = Plane.create({ normal: direction, constant: -near });
    const pt = Plane.intersectLine(nearP, vl);

    return pt != null ? Vector3.add(pt, position) : undefined;
  }

  protected computeCameraMatrices(): FrameCameraMatrices {
    if (this.cameraMatrices == null) {
      return {
        viewMatrix: Matrix4.makeIdentity(),
        worldMatrix: Matrix4.makeIdentity(),
        projectionMatrix: Matrix4.makeIdentity(),
        projectionMatrixInverse: Matrix4.makeIdentity(),
        projectionViewMatrix: Matrix4.makeIdentity(),
      };
    }
    return this.cameraMatrices;
  }

  protected updateCameraMatrices(
    cameraMatrices: FrameCameraMatrices
  ): FrameCameraMatrices {
    this.cameraMatrices = cameraMatrices;

    return this.cameraMatrices;
  }
}

export interface FrameCameraWithMatrices extends FrameCameraBase {
  readonly direction: Vector3.Vector3;
  readonly viewVector: Vector3.Vector3;
  readonly worldMatrix: Matrix4.Matrix4;
  readonly viewMatrix: Matrix4.Matrix4;
  readonly projectionMatrix: Matrix4.Matrix4;
  readonly projectionMatrixInverse: Matrix4.Matrix4;
  readonly projectionViewMatrix: Matrix4.Matrix4;
}

export class FramePerspectiveCamera
  extends FrameCameraBase
  implements FrameCameraWithMatrices, FramePerspectiveCameraLike
{
  public constructor(
    public readonly position: Vector3.Vector3,
    public readonly lookAt: Vector3.Vector3,
    public readonly up: Vector3.Vector3,
    public readonly near: number,
    public readonly far: number,
    public readonly aspectRatio: number,
    public readonly fovY: number
  ) {
    super(position, lookAt, up, near, far, aspectRatio);
  }

  /**
   * Converts this `FramePerspectiveCamera` to a `FrameOrthographicCamera` using
   * the provided `boundingBox` to compute the viewing frustum.
   *
   * @param boundingBox The visible bounding box.
   */
  public toOrthographic(boundingBox: BoundingBox.BoundingBox): FrameCameraBase {
    return FrameCameraBase.fromBoundingBox(
      FrameCamera.toOrthographic(this, boundingBox),
      boundingBox,
      this.aspectRatio
    );
  }

  public override isPerspective(): this is FramePerspectiveCamera {
    return true;
  }

  protected override computeCameraMatrices(): FrameCameraMatrices {
    if (this.cameraMatrices == null) {
      const viewMatrix = Matrix4.makeLookAtView(
        this.position,
        this.lookAt,
        this.up
      );
      const worldMatrix = Matrix4.invert(viewMatrix);
      const projectionMatrix = Matrix4.makePerspective(
        this.near,
        this.far,
        this.fovY,
        this.aspectRatio
      );
      const projectionMatrixInverse = Matrix4.invert(projectionMatrix);
      const projectionViewMatrix = Matrix4.multiply(
        projectionMatrix,
        viewMatrix
      );

      return super.updateCameraMatrices({
        viewMatrix,
        worldMatrix,
        projectionMatrix,
        projectionMatrixInverse,
        projectionViewMatrix,
      });
    }
    return this.cameraMatrices;
  }
}

export class FrameOrthographicCamera
  extends FrameCameraBase
  implements FrameCameraWithMatrices, FrameOrthographicCameraLike
{
  public readonly top: number;
  public readonly bottom: number;
  public readonly right: number;
  public readonly left: number;

  public constructor(
    viewVector: Vector3.Vector3,
    public readonly lookAt: Vector3.Vector3,
    public readonly up: Vector3.Vector3,
    public readonly near: number,
    public readonly far: number,
    public readonly aspectRatio: number,
    public readonly fovHeight: number
  ) {
    super(
      Vector3.add(lookAt, Vector3.negate(viewVector)),
      lookAt,
      up,
      near,
      far,
      aspectRatio
    );
    this.top = fovHeight * 0.5;
    this.bottom = -this.top;
    this.right = this.top * aspectRatio;
    this.left = -this.right;
  }

  /**
   * Converts this `FrameOrthographicCamera` to a `FramePerspectiveCamera` using
   * the provided `boundingBox` to compute the near and far clipping planes.
   *
   * @param boundingBox The visible bounding box.
   */
  public toPerspective(boundingBox: BoundingBox.BoundingBox): FrameCameraBase {
    return FrameCameraBase.fromBoundingBox(
      FrameCamera.toPerspective(this),
      boundingBox,
      this.aspectRatio
    );
  }

  public override isOrthographic(): this is FrameOrthographicCamera {
    return true;
  }

  public override get frustumProjectionViewMatrix(): Matrix4.Matrix4 {
    const frustumProjectionMatrix = Matrix4.makeFrustum(
      this.left,
      this.right,
      this.top,
      this.bottom,
      this.near,
      this.far
    );
    return Matrix4.multiply(
      frustumProjectionMatrix,
      this.computeCameraMatrices().viewMatrix
    );
  }

  protected override computeCameraMatrices(): FrameCameraMatrices {
    if (this.cameraMatrices == null) {
      const viewMatrix = Matrix4.makeLookAtView(
        this.position,
        this.lookAt,
        this.up
      );
      const worldMatrix = Matrix4.invert(viewMatrix);
      const projectionMatrix = Matrix4.makeOrthographic(
        this.left,
        this.right,
        this.bottom,
        this.top,
        this.near,
        this.far
      );
      const projectionMatrixInverse = Matrix4.invert(projectionMatrix);
      const projectionViewMatrix = Matrix4.multiply(
        projectionMatrix,
        viewMatrix
      );

      return super.updateCameraMatrices({
        viewMatrix,
        worldMatrix,
        projectionMatrix,
        projectionMatrixInverse,
        projectionViewMatrix,
      });
    }
    return this.cameraMatrices;
  }
}
