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

export class ReceivedFrame {
  private cachedDepthBuffer?: Promise<DepthBuffer | undefined>;

  public constructor(
    public readonly correlationIds: string[],
    public readonly sequenceNumber: number,
    public readonly dimensions: Dimensions.Dimensions,
    public readonly image: ReceivedFrameImage,
    public readonly scene: ReceivedFrameScene,
    public readonly depthBufferBytes: Uint8Array | undefined
  ) {}

  public depthBuffer(): Promise<DepthBuffer | undefined> {
    if (this.cachedDepthBuffer == null) {
      if (this.depthBufferBytes != null) {
        this.cachedDepthBuffer = decodePng(this.depthBufferBytes).then((png) =>
          DepthBuffer.fromPng(
            png,
            this.scene.camera,
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

export class ReceivedFrameImage {
  public constructor(
    public readonly rect: Rectangle.Rectangle,
    public readonly scale: number,
    public readonly data: Uint8Array
  ) {}
}

export class ReceivedFrameScene {
  public constructor(
    public readonly camera: ReceivedPerspectiveCamera,
    public readonly boundingBox: BoundingBox.BoundingBox,
    public readonly crossSection: CrossSectioning.CrossSectioning
  ) {}
}

interface ReceivedCameraLike {
  readonly worldMatrix: Matrix4.Matrix4;
  readonly viewMatrix: Matrix4.Matrix4;
  readonly projectionMatrix: Matrix4.Matrix4;
  readonly projectionViewMatrix: Matrix4.Matrix4;
  readonly direction: Vector3.Vector3;
}

interface ReceivedPerspectiveCameraLike {
  readonly position: Vector3.Vector3;
  readonly lookAt: Vector3.Vector3;
  readonly up: Vector3.Vector3;
  readonly near: number;
  readonly far: number;
  readonly aspectRatio: number;
  readonly fovY: number;
}

export class ReceivedPerspectiveCamera
  implements ReceivedCameraLike, ReceivedPerspectiveCameraLike {
  private cameraMatrices?: ReceivedCameraLike;

  public constructor(private readonly data: ReceivedPerspectiveCameraLike) {}

  public static fromBoundingBox(
    camera: FrameCamera.FrameCamera,
    boundingBox: BoundingBox.BoundingBox,
    aspectRatio: number
  ): ReceivedPerspectiveCamera {
    const { near, far } = ClippingPlanes.fromBoundingBoxAndLookAtCamera(
      boundingBox,
      camera
    );
    return new ReceivedPerspectiveCamera({
      position: camera.position,
      lookAt: camera.lookAt,
      up: camera.up,
      near,
      far,
      aspectRatio,
      fovY: 45,
    });
  }

  private computeCameraMatrices(): ReceivedCameraLike {
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
      const direction = Vector3.normalize(
        Vector3.subtract(this.lookAt, this.position)
      );

      this.cameraMatrices = {
        viewMatrix,
        worldMatrix,
        projectionMatrix,
        projectionViewMatrix,
        direction,
      };
    }
    return this.cameraMatrices;
  }

  public get direction(): Vector3.Vector3 {
    return this.computeCameraMatrices().direction;
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

  public get position(): Vector3.Vector3 {
    return this.data.position;
  }

  public get lookAt(): Vector3.Vector3 {
    return this.data.lookAt;
  }

  public get up(): Vector3.Vector3 {
    return this.data.up;
  }

  public get near(): number {
    return this.data.near;
  }

  public get far(): number {
    return this.data.far;
  }

  public get aspectRatio(): number {
    return this.data.aspectRatio;
  }

  public get fovY(): number {
    return this.data.fovY;
  }
}
