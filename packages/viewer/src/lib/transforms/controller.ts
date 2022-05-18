import { vertexvis } from '@vertexvis/frame-streaming-protos';
import { Matrix4, Vector3 } from '@vertexvis/geometry';
import { StreamApi } from '@vertexvis/stream-api';

export class TransformController {
  private isTransforming = false;
  private currentDelta: Matrix4.Matrix4 = Matrix4.makeIdentity();

  public constructor(private stream: StreamApi) {}

  public async dispose(): Promise<void> {
    if (this.isTransforming) {
      this.endTransform();
    }
  }

  public async beginTransform(
    delta: Matrix4.Matrix4 = Matrix4.makeIdentity()
  ): Promise<void> {
    if (!this.isTransforming) {
      this.currentDelta = delta;
      this.isTransforming = true;

      console.debug('Beginning transform interaction');

      await this.stream.beginInteraction({
        transform: {
          delta: this.toDeltaTransform(delta),
        },
      });
    }
  }

  public async updateTranslation(delta: Vector3.Vector3): Promise<void> {
    this.currentDelta = Matrix4.makeTranslation(delta);

    await this.stream.updateInteraction({
      transform: {
        delta: this.toDeltaTransform(this.currentDelta),
      },
    });
  }

  public getCurrentDelta(): Matrix4.Matrix4 | undefined {
    return this.currentDelta;
  }

  public async endTransform(): Promise<void> {
    if (this.isTransforming) {
      console.debug(
        `Ending transform interaction [delta=${this.currentDelta}]`
      );

      await this.stream.endInteraction({
        transform: {
          delta: this.toDeltaTransform(this.currentDelta),
        },
      });
      this.isTransforming = false;
      this.currentDelta = Matrix4.makeIdentity();
    }
  }

  public async endInteraction(): Promise<void> {
    if (this.isTransforming) {
      await this.stream.endInteraction();
      this.isTransforming = false;
      this.currentDelta = Matrix4.makeIdentity();
    }
  }

  public clearTransform(): void {
    this.currentDelta = Matrix4.makeIdentity();
    this.endTransform();
  }

  private toDeltaTransform(
    delta: Matrix4.Matrix4
  ): vertexvis.protobuf.core.IAffineMatrix4f {
    const asObject = Matrix4.toObject(delta);

    return {
      basisX: {
        x: asObject.m11,
        y: asObject.m12,
        z: asObject.m13,
      },
      basisY: {
        x: asObject.m21,
        y: asObject.m22,
        z: asObject.m23,
      },
      basisZ: {
        x: asObject.m31,
        y: asObject.m32,
        z: asObject.m33,
      },
      xlate: {
        x: asObject.m14,
        y: asObject.m24,
        z: asObject.m34,
      },
      scale: asObject.m44,
    };
  }
}
