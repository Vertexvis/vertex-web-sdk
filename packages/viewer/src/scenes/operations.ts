import { ColorMaterial } from './colorMaterial';
import { vertexvis } from '@vertexvis/frame-streaming-protos';

interface ShowItemOperation {
  type: 'show';
}

interface HideItemOperation {
  type: 'hide';
}

interface ClearItemOperation {
  type: 'clear-override';
}

export interface ChangeMaterialOperation {
  type: 'change-material';
  color: ColorMaterial;
}

export interface TransformOperation {
  type: 'change-transform';
  transform: vertexvis.protobuf.core.IMatrix4x4f;
}

export type ItemOperation =
  | ShowItemOperation
  | HideItemOperation
  | ChangeMaterialOperation
  | ClearItemOperation
  | TransformOperation;

export interface SceneItemOperations<T> {
  materialOverride(color: ColorMaterial): T;
  show(): T;
  hide(): T;
  clearMaterialOverrides(): T;
}

/**
 * A class to handle the building of operations for a scene.
 */
export class SceneOperationBuilder
  implements SceneItemOperations<SceneOperationBuilder> {
  private operations: ItemOperation[] = [];

  public constructor(operations: ItemOperation[] = []) {
    this.operations = operations;
  }

  /**
   * Constructs the scene operations and returns a definition describing each
   * operation.
   */
  public build(): ItemOperation[] {
    return this.operations.concat();
  }

  public materialOverride(color: ColorMaterial): SceneOperationBuilder {
    return new SceneOperationBuilder(
      this.operations.concat([{ type: 'change-material', color }])
    );
  }

  public show(): SceneOperationBuilder {
    return new SceneOperationBuilder(
      this.operations.concat([{ type: 'show' }])
    );
  }

  public hide(): SceneOperationBuilder {
    return new SceneOperationBuilder(
      this.operations.concat([{ type: 'hide' }])
    );
  }

  public clearMaterialOverrides(): SceneOperationBuilder {
    return new SceneOperationBuilder(
      this.operations.concat([{ type: 'clear-override' }])
    );
  }

  public transform(
    matrix: vertexvis.protobuf.core.IMatrix4x4f
  ): SceneOperationBuilder {
    return new SceneOperationBuilder(
      this.operations.concat([{ type: 'change-transform', transform: matrix }])
    );
  }
}
