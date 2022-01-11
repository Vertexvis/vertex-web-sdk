import {
  BoundingBox,
  Dimensions,
  Line3,
  Matrix4,
  Plane,
  Rectangle,
  Vector3,
} from '@vertexvis/geometry';

import { decodePng } from '../../workers/png-decoder-pool';
import * as ClippingPlanes from './clippingPlanes';
import * as CrossSectioning from './crossSectioning';
import { DepthBuffer } from './depthBuffer';
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
    private readonly featureMapBytes: Uint8Array | undefined
  ) {}

  public async depthBuffer(): Promise<DepthBuffer | undefined> {
    if (this.cachedDepthBuffer == null) {
      this.cachedDepthBuffer =
        this.depthBufferBytes != null
          ? this.decodeDepthBuffer(this.depthBufferBytes)
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
          ? this.decodeFeatureMap(this.featureMapBytes)
          : Promise.resolve(undefined);
    }
    return this.cachedFeatureMap;
  }

  private async decodeFeatureMap(bytes: Uint8Array): Promise<FeatureMap> {
    const png = await decodePng(bytes);
    return FeatureMap.fromPng(png, this.image.imageAttr);
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
    public readonly camera: FramePerspectiveCamera,
    public readonly boundingBox: BoundingBox.BoundingBox,
    public readonly crossSection: CrossSectioning.CrossSectioning,
    public readonly worldOrientation: Orientation,
    public readonly hasChanged: boolean
  ) {}
}

interface FrameCameraMatrices {
  readonly worldMatrix: Matrix4.Matrix4;
  readonly viewMatrix: Matrix4.Matrix4;
  readonly projectionMatrix: Matrix4.Matrix4;
  readonly projectionMatrixInverse: Matrix4.Matrix4;
  readonly projectionViewMatrix: Matrix4.Matrix4;
}

interface FramePerspectiveCameraLike {
  readonly position: Vector3.Vector3;
  readonly lookAt: Vector3.Vector3;
  readonly up: Vector3.Vector3;
  readonly near: number;
  readonly far: number;
  readonly aspectRatio: number;
  readonly fovY: number;
}

export class FramePerspectiveCamera
  implements FrameCameraMatrices, FramePerspectiveCameraLike
{
  private cameraMatrices?: FrameCameraMatrices;

  public constructor(
    public readonly position: Vector3.Vector3,
    public readonly lookAt: Vector3.Vector3,
    public readonly up: Vector3.Vector3,
    public readonly near: number,
    public readonly far: number,
    public readonly aspectRatio: number,
    public readonly fovY: number
  ) {}

  public static fromBoundingBox(
    camera: FrameCamera.FrameCamera,
    boundingBox: BoundingBox.BoundingBox,
    aspectRatio: number
  ): FramePerspectiveCamera {
    const { near, far } = ClippingPlanes.fromBoundingBoxAndLookAtCamera(
      boundingBox,
      camera
    );
    return new FramePerspectiveCamera(
      camera.position,
      camera.lookAt,
      camera.up,
      near,
      far,
      aspectRatio,
      45
    );
  }

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

  private computeCameraMatrices(): FrameCameraMatrices {
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

      this.cameraMatrices = {
        viewMatrix,
        worldMatrix,
        projectionMatrix,
        projectionMatrixInverse,
        projectionViewMatrix,
      };
    }
    return this.cameraMatrices;
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
}
