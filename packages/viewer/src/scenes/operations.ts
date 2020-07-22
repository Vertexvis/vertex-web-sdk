import { ColorMaterial } from './colorMaterial';

interface ShowItemOperation {
  type: 'show';
}

interface HideItemOperation {
  type: 'hide';
}

export interface OperationDefinition {
  operation: ItemOperation;
}

export interface ChangeMaterialOperation {
  type: 'change-material';
  color: ColorMaterial;
}

export type ItemOperation =
  | ShowItemOperation
  | HideItemOperation
  | ChangeMaterialOperation;

export interface SceneItemOperations<T> {
  materialOverride(color: ColorMaterial): T;
  show(): T;
  hide(): T;
}

export class SceneOperationBuilder
  implements SceneItemOperations<SceneOperationBuilder> {
  private operations: OperationDefinition[] = [];

  /**
   * Constructs the scene operations and returns a definition describing each
   * operation.
   */
  public build(): OperationDefinition[] {
    return this.operations.concat();
  }

  public materialOverride(color: ColorMaterial): SceneOperationBuilder {
    return this.operation({ type: 'change-material', color });
  }

  public show(): SceneOperationBuilder {
    return this.operation({ type: 'show' });
  }

  public hide(): SceneOperationBuilder {
    return this.operation({ type: 'hide' });
  }

  private operation(operation: ItemOperation): SceneOperationBuilder;

  private operation(...args: any[]): this {
    const operation = args[0];
    if (args.length === 1) {
      this.operations.push({ operation });
    } else if (args.length === 2) {
      this.operations.push({ operation });
    }
    return this;
  }
}
