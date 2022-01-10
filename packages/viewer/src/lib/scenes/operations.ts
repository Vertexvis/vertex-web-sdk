import { vertexvis } from '@vertexvis/frame-streaming-protos';

import { ColorMaterial } from './colorMaterial';

interface ShowItemOperation {
  type: 'show';
}

interface HideItemOperation {
  type: 'hide';
}

interface SelectItemOperation {
  type: 'select';
  material: ColorMaterial;
}

interface DeselectItemOperation {
  type: 'deselect';
}

interface ClearItemOperation {
  type: 'clear-override';
}

export interface ChangeMaterialOperation {
  type: 'change-material';
  material: ColorMaterial;
}

export interface TransformOperation {
  type: 'change-transform';
  transform: vertexvis.protobuf.core.IMatrix4x4f;
}

export type ItemOperation =
  | ShowItemOperation
  | HideItemOperation
  | SelectItemOperation
  | DeselectItemOperation
  | ChangeMaterialOperation
  | ClearItemOperation
  | TransformOperation;

export interface SceneItemOperations<T> {
  materialOverride(color: ColorMaterial): T;
  show(): T;
  hide(): T;
  select(color: ColorMaterial): T;
  deselect(): T;
  clearMaterialOverrides(): T;
}

/**
 * A class to handle the building of operations for a scene.
 */
export class SceneOperationBuilder
  implements SceneItemOperations<SceneOperationBuilder>
{
  public constructor(private operations: ItemOperation[] = []) {}

  /**
   * Constructs the scene operations and returns a definition describing each
   * operation.
   */
  public build(): ItemOperation[] {
    return this.operations.concat();
  }

  public materialOverride(material: ColorMaterial): SceneOperationBuilder {
    return new SceneOperationBuilder(
      this.operations.concat([{ type: 'change-material', material }])
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

  public select(material: ColorMaterial): SceneOperationBuilder {
    return new SceneOperationBuilder(
      this.operations.concat([{ type: 'select', material }])
    );
  }

  public deselect(): SceneOperationBuilder {
    return new SceneOperationBuilder(
      this.operations.concat([{ type: 'deselect' }])
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
