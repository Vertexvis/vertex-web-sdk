import { vertexvis } from '@vertexvis/frame-streaming-protos';
import { Matrix4, Vector3 } from '@vertexvis/geometry';
import { StreamApi } from '@vertexvis/stream-api';

export class TransformController {
  private isTransforming = false;
  private previousDelta?: Matrix4.Matrix4;
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
    this.clearEndInteractionTimeout();

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
      await this.endInteraction();
    }
  }

  public async endTransformDebounced(
    startCallback?: VoidFunction,
    endCallback?: VoidFunction
  ): Promise<void> {
    if (this.isTransforming) {
      this.restartEndInteractionTimeout(startCallback, endCallback);
    }
  }

  public clearTransform(): void {
    this.currentDelta = Matrix4.makeIdentity();
    this.previousDelta = undefined;
    this.endTransform();
  }

  public async EXPERIMENTAL_undoTransform(): Promise<
    Matrix4.Matrix4 | undefined
  > {
    if (this.previousDelta != null) {
      const undoDelta = Matrix4.invert(this.previousDelta);

      console.debug(`Undo of previous transform [delta-applied=${undoDelta}]`);

      await this.beginTransform();
      await this.updateTransform(Matrix4.invert(this.previousDelta));
      await this.endTransform();

      this.previousDelta = undefined;

      return undoDelta;
    } else {
      console.debug('No previous transform to undo.');
    }
  }

  private async endInteraction(): Promise<void> {
    console.debug(`Ending transform interaction [delta=${this.currentDelta}]`);

    this.clearEndInteractionTimeout();

    this.previousDelta = this.currentDelta;
    await this.stream.endInteraction({
      transform: {
        delta: this.toDeltaTransform(this.currentDelta),
      },
    });
    this.isTransforming = false;
    this.currentDelta = Matrix4.makeIdentity();
  }

  private restartEndInteractionTimeout(
    startCallback?: VoidFunction,
    endCallback?: VoidFunction
  ): void {
    this.clearEndInteractionTimeout();

    this.endDebounceTimeout = setTimeout(async () => {
      startCallback?.();
      await this.endInteraction();
      endCallback?.();
    }, 500);
  }

  private clearEndInteractionTimeout(): void {
    if (this.endDebounceTimeout != null) {
      clearTimeout(this.endDebounceTimeout);
      this.endDebounceTimeout = undefined;
    }
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
