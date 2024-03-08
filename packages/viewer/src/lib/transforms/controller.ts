import { vertexvis } from '@vertexvis/frame-streaming-protos';
import { Matrix4, Vector3 } from '@vertexvis/geometry';
import { StreamApi } from '@vertexvis/stream-api';

export class TransformController {
  private isTransforming = false;
  private currentDelta: Matrix4.Matrix4 = Matrix4.makeIdentity();
  private endDebounceTimeout?: NodeJS.Timeout;

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

  public async updateTransform(delta: Matrix4.Matrix4): Promise<void> {
    this.currentDelta = delta;

    console.log(delta);

    await this.stream.updateInteraction({
      transform: {
        delta: this.toDeltaTransform(this.currentDelta, true),
      },
    });
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
      this.endInteraction();
    }
  }

  public async endTransformDebounced(callback?: VoidFunction): Promise<void> {
    if (this.isTransforming) {
      this.restartEndInteractionTimeout(callback);
    }
  }

  public clearTransform(): void {
    this.currentDelta = Matrix4.makeIdentity();
    this.endTransform();
  }

  private async endInteraction(): Promise<void> {
    console.debug(`Ending transform interaction [delta=${this.currentDelta}]`);

    await this.stream.endInteraction({
      transform: {
        delta: this.toDeltaTransform(this.currentDelta),
      },
    });
    this.isTransforming = false;
    this.currentDelta = Matrix4.makeIdentity();
  }

  private restartEndInteractionTimeout(callback?: VoidFunction): void {
    if (this.endDebounceTimeout != null) {
      clearTimeout(this.endDebounceTimeout);
      this.endDebounceTimeout = undefined;
    }
    this.endDebounceTimeout = setTimeout(() => {
      this.endDebounceTimeout = undefined;
      this.endInteraction();
      callback?.();
    }, 500);
  }

  private toDeltaTransform(
    delta: Matrix4.Matrix4,
    columnMajor = false
  ): vertexvis.protobuf.core.IAffineMatrix4f {
    const asObject = Matrix4.toObject(delta);

    // TODO: update this to pass a single order for the
    // transform matrix after work in https://vertexvis.atlassian.net/browse/PLAT-1582
    const basisX = columnMajor
      ? {
          x: asObject.m11,
          y: asObject.m21,
          z: asObject.m31,
        }
      : {
          x: asObject.m11,
          y: asObject.m12,
          z: asObject.m13,
        };
    const basisY = columnMajor
      ? {
          x: asObject.m12,
          y: asObject.m22,
          z: asObject.m32,
        }
      : {
          x: asObject.m21,
          y: asObject.m22,
          z: asObject.m23,
        };
    const basisZ = columnMajor
      ? {
          x: asObject.m13,
          y: asObject.m23,
          z: asObject.m33,
        }
      : {
          x: asObject.m31,
          y: asObject.m32,
          z: asObject.m33,
        };

    return {
      basisX,
      basisY,
      basisZ,
      xlate: {
        x: asObject.m14,
        y: asObject.m24,
        z: asObject.m34,
      },
      scale: asObject.m44,
    };
  }
}
