import { vertexvis } from '@vertexvis/frame-streaming-protos';
import { Matrix4 } from '@vertexvis/geometry';
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
      await this.stream.beginInteraction({
        transform: {
          delta: this.toDeltaTransform(delta),
        },
      });
    }
  }

  public async updateTransform(delta: Matrix4.Matrix4): Promise<void> {
    this.currentDelta = delta;

    await this.stream.performInteraction({
      transform: {
        delta: this.toDeltaTransform(delta),
      },
    });
  }

  public async endTransform(): Promise<void> {
    if (this.isTransforming) {
      this.isTransforming = false;
      await this.stream.endInteraction({
        transform: {
          delta: this.toDeltaTransform(this.currentDelta),
        },
      });
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
      xlate: {
        x: asObject.m14,
        y: asObject.m24,
        z: asObject.m34,
      },
    };
  }
}
