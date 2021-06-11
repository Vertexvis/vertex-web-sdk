import {
  Dimensions,
  Vector3,
  Rectangle,
  BoundingBox,
  Matrix4,
} from '@vertexvis/geometry';
import { vertexvis } from '@vertexvis/frame-streaming-protos';
import * as FrameCamera from './frameCamera';
import * as CrossSectioning from './crossSectioning';
import * as ClippingPlanes from './clippingPlanes';
import { DepthBuffer } from './depthBuffer';
import { decodePng } from '../../workers/png-decoder.worker';

export interface Frame {
  correlationIds: string[];
  imageAttributes: ImageAttributes;
  sceneAttributes: SceneAttributes;
  sequenceNumber: number;
  image: Uint8Array;
  depthBuffer?: Uint8Array;
}

export interface ImageAttributes {
  frameDimensions: Dimensions.Dimensions;
  imageRect: Rectangle.Rectangle;
  scaleFactor: number;
}

export interface SceneAttributes {
  camera: FrameCamera.FrameCamera;
  visibleBoundingBox: BoundingBox.BoundingBox;
  crossSectioning: CrossSectioning.CrossSectioning;
}

export const fromProto = (
  payload: vertexvis.protobuf.stream.IDrawFramePayload
): Frame => {
  const {
    frameCorrelationIds,
    imageAttributes,
    sceneAttributes,
    sequenceNumber,
    image,
    depthBuffer,
  } = payload;
  if (
    imageAttributes == null ||
    imageAttributes.frameDimensions == null ||
    imageAttributes.imageRect == null ||
    sceneAttributes == null ||
    sceneAttributes.camera == null ||
    imageAttributes.frameDimensions.width == null ||
    imageAttributes.frameDimensions.height == null ||
    imageAttributes.imageRect.x == null ||
    imageAttributes.imageRect.y == null ||
    imageAttributes.imageRect.width == null ||
    imageAttributes.imageRect.height == null ||
    imageAttributes.scaleFactor == null ||
    sequenceNumber == null ||
    image == null
  ) {
    throw new Error('Invalid payload');
  }

  return {
    correlationIds: frameCorrelationIds || [],
    imageAttributes: {
      frameDimensions: Dimensions.create(
        imageAttributes.frameDimensions.width,
        imageAttributes.frameDimensions.height
      ),
      imageRect: Rectangle.create(
        imageAttributes.imageRect.x,
        imageAttributes.imageRect.y,
        imageAttributes.imageRect.width,
        imageAttributes.imageRect.height
      ),
      scaleFactor: imageAttributes.scaleFactor,
    },
    sceneAttributes: {
      camera: FrameCamera.create({
        position: Vector3.create({
          x: sceneAttributes.camera.position?.x || undefined,
          y: sceneAttributes.camera.position?.y || undefined,
          z: sceneAttributes.camera.position?.z || undefined,
        }),
        lookAt: Vector3.create({
          x: sceneAttributes.camera.lookAt?.x || undefined,
          y: sceneAttributes.camera.lookAt?.y || undefined,
          z: sceneAttributes.camera.lookAt?.z || undefined,
        }),
        up: Vector3.create({
          x: sceneAttributes.camera.up?.x || undefined,
          y: sceneAttributes.camera.up?.y || undefined,
          z: sceneAttributes.camera.up?.z || undefined,
        }),
      }),
      visibleBoundingBox: BoundingBox.create(
        Vector3.create({
          x: sceneAttributes.visibleBoundingBox?.xmin || undefined,
          y: sceneAttributes.visibleBoundingBox?.ymin || undefined,
          z: sceneAttributes.visibleBoundingBox?.zmin || undefined,
        }),
        Vector3.create({
          x: sceneAttributes.visibleBoundingBox?.xmax || undefined,
          y: sceneAttributes.visibleBoundingBox?.ymax || undefined,
          z: sceneAttributes.visibleBoundingBox?.zmax || undefined,
        })
      ),
      crossSectioning: CrossSectioning.create({
        sectionPlanes: sceneAttributes.crossSectioning?.sectionPlanes?.map(
          (sp) => ({
            normal: Vector3.create({
              x: sp.normal?.x || undefined,
              y: sp.normal?.y || undefined,
              z: sp.normal?.z || undefined,
            }),
            offset: sp.offset || 0,
          })
        ),
      }),
    },
    sequenceNumber: sequenceNumber,
    image,
    depthBuffer: depthBuffer?.value || undefined,
  };
};

export class ReceivedFrame {
  private cachedDepthBuffer?: Promise<DepthBuffer | undefined>;

  public constructor(
    public readonly correlationIds: string[],
    public readonly sequenceNumber: number,
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
