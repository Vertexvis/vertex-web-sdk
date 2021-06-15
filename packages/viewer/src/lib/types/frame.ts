import {
  Dimensions,
  Vector3,
  Rectangle,
  BoundingBox,
  Matrix4,
} from '@vertexvis/geometry';
import * as FrameCamera from './frameCamera';
import * as CrossSectioning from './crossSectioning';
import * as ClippingPlanes from './clippingPlanes';
import { DepthBuffer } from './depthBuffer';
import { decodePng } from '../../workers/png-decoder.worker';

export class Frame {
  private cachedDepthBuffer?: Promise<DepthBuffer | undefined>;

  public constructor(
    public readonly correlationIds: string[],
    public readonly sequenceNumber: number,
    public readonly dimensions: Dimensions.Dimensions,
    public readonly image: FrameImage,
    public readonly scene: FrameScene,
    public readonly depthBufferBytes: Uint8Array | undefined
  ) {}

  public depthBuffer(): Promise<DepthBuffer | undefined> {
    if (this.cachedDepthBuffer == null) {
      if (this.depthBufferBytes != null) {
        this.cachedDepthBuffer = decodePng(this.depthBufferBytes).then((png) =>
          DepthBuffer.fromPng(
            png,
            this.scene.camera,
            this.dimensions,
            this.image.rect,
            this.image.scale
          )
        );
      } else {
        this.cachedDepthBuffer = Promise.resolve(undefined);
      }
    }
    return this.cachedDepthBuffer;
  }
}

export type FrameImageLike = Pick<FrameImage, 'dimensions' | 'rect' | 'scale'>;

export class FrameImage implements FrameImageLike {
  public constructor(
    public readonly dimensions: Dimensions.Dimensions,
    public readonly rect: Rectangle.Rectangle,
    public readonly scale: number,
    public readonly data: Uint8Array
  ) {}
}

export class FrameScene {
  public constructor(
    public readonly camera: FramePerspectiveCamera,
    public readonly boundingBox: BoundingBox.BoundingBox,
    public readonly crossSection: CrossSectioning.CrossSectioning
  ) {}
}

interface FrameCameraMatrices {
  readonly worldMatrix: Matrix4.Matrix4;
  readonly viewMatrix: Matrix4.Matrix4;
  readonly projectionMatrix: Matrix4.Matrix4;
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
  implements FrameCameraMatrices, FramePerspectiveCameraLike {
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
      const projectionViewMatrix = Matrix4.multiply(
        projectionMatrix,
        viewMatrix
      );

      this.cameraMatrices = {
        viewMatrix,
        worldMatrix,
        projectionMatrix,
        projectionViewMatrix,
      };
    }
    return this.cameraMatrices;
  }

  public get direction(): Vector3.Vector3 {
    return Vector3.normalize(Vector3.subtract(this.lookAt, this.position));
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

  public get projectionViewMatrix(): Matrix4.Matrix4 {
    return this.computeCameraMatrices().projectionViewMatrix;
  }
}
