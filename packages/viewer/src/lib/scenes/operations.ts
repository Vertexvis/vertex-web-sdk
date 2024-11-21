import { vertexvis } from '@vertexvis/frame-streaming-protos';
import { UUID } from '@vertexvis/utils';

import { ColorMaterial } from './colorMaterial';

export type RepresentationId = UUID.UUID | 'empty' | 'entire-part';

interface ShowItemOperation {
  type: 'show';
}

interface HideItemOperation {
  type: 'hide';
}

interface SelectItemOperation {
  type: 'select';
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

export interface ClearTransformOperation {
  type: 'clear-transform';
  cascade?: boolean;
}

export interface ChangePhantomOperation {
  type: 'change-phantom';
  phantomState?: boolean;
}

interface ClearPhantomOperation {
  type: 'clear-phantom';
}

export interface ChangeEndItemOperation {
  type: 'change-end-item';
  endItemState?: boolean;
}

interface ClearEndItemOperation {
  type: 'clear-end-item';
}

interface ViewRenditionById {
  type: 'view-rendition-by-id';
  id: UUID.UUID;
}

interface ViewRenditionBySuppliedId {
  type: 'view-rendition-by-supplied-id';
  suppliedId: string;
}

interface ViewDefaultRendition {
  type: 'view-default-rendition';
}

interface ClearRendition {
  type: 'clear-rendition';
}

interface ViewRepresentation {
  type: 'view-representation';
  id: RepresentationId;
}

interface ClearRepresentation {
  type: 'clear-representation';
}

export type ItemOperation =
  | ShowItemOperation
  | HideItemOperation
  | SelectItemOperation
  | DeselectItemOperation
  | ChangeMaterialOperation
  | ClearItemOperation
  | TransformOperation
  | ClearTransformOperation
  | ChangePhantomOperation
  | ClearPhantomOperation
  | ChangeEndItemOperation
  | ClearEndItemOperation
  | ViewRenditionById
  | ViewRenditionBySuppliedId
  | ViewDefaultRendition
  | ClearRendition
  | ViewRepresentation
  | ClearRepresentation;

export interface SceneItemOperations<T> {
  materialOverride(color: ColorMaterial): T;
  show(): T;
  hide(): T;
  select(color: ColorMaterial): T;
  deselect(): T;
  clearMaterialOverrides(): T;
  clearTransforms(): T;
  setPhantom(phantomState?: boolean): T;
  clearPhantom(): T;
  setEndItem(endItemState?: boolean): T;
  clearEndItem(): T;
  viewRenditionById(id: UUID.UUID): T;
  viewRenditionBySuppliedId(id: string): T;
  viewDefaultRendition(): T;
  clearRendition(): T;
  viewRepresentation(id: RepresentationId): T;
  clearRepresentation(): T;
}

/**
 * A class to handle the building of operations on scene items for a scene.
 */
export class ItemOperationBuilder
  implements SceneItemOperations<ItemOperationBuilder>
{
  public constructor(private operations: ItemOperation[] = []) {}

  /**
   * Constructs the scene operations and returns a definition describing each
   * operation.
   */
  public build(): ItemOperation[] {
    return this.operations.concat();
  }

  public materialOverride(material: ColorMaterial): ItemOperationBuilder {
    return new ItemOperationBuilder(
      this.operations.concat([{ type: 'change-material', material }])
    );
  }

  public show(): ItemOperationBuilder {
    return new ItemOperationBuilder(this.operations.concat([{ type: 'show' }]));
  }

  public hide(): ItemOperationBuilder {
    return new ItemOperationBuilder(this.operations.concat([{ type: 'hide' }]));
  }

  public select(): ItemOperationBuilder {
    return new ItemOperationBuilder(
      this.operations.concat([{ type: 'select' }])
    );
  }

  public deselect(): ItemOperationBuilder {
    return new ItemOperationBuilder(
      this.operations.concat([{ type: 'deselect' }])
    );
  }

  public clearMaterialOverrides(): ItemOperationBuilder {
    return new ItemOperationBuilder(
      this.operations.concat([{ type: 'clear-override' }])
    );
  }

  public transform(
    matrix: vertexvis.protobuf.core.IMatrix4x4f
  ): ItemOperationBuilder {
    return new ItemOperationBuilder(
      this.operations.concat([{ type: 'change-transform', transform: matrix }])
    );
  }

  public clearTransforms(cascade = true): ItemOperationBuilder {
    return new ItemOperationBuilder(
      this.operations.concat([{ type: 'clear-transform', cascade }])
    );
  }

  public setPhantom(phantomState?: boolean): ItemOperationBuilder {
    return new ItemOperationBuilder(
      this.operations.concat([{ type: 'change-phantom', phantomState }])
    );
  }

  public clearPhantom(): ItemOperationBuilder {
    return new ItemOperationBuilder(
      this.operations.concat([{ type: 'clear-phantom' }])
    );
  }

  public setEndItem(endItemState?: boolean): ItemOperationBuilder {
    return new ItemOperationBuilder(
      this.operations.concat([{ type: 'change-end-item', endItemState }])
    );
  }

  public clearEndItem(): ItemOperationBuilder {
    return new ItemOperationBuilder(
      this.operations.concat([{ type: 'clear-end-item' }])
    );
  }

  public viewRenditionById(id: UUID.UUID): ItemOperationBuilder {
    return new ItemOperationBuilder(
      this.operations.concat([{ type: 'view-rendition-by-id', id }])
    );
  }

  public viewRenditionBySuppliedId(suppliedId: string): ItemOperationBuilder {
    return new ItemOperationBuilder(
      this.operations.concat([
        { type: 'view-rendition-by-supplied-id', suppliedId },
      ])
    );
  }

  public viewDefaultRendition(): ItemOperationBuilder {
    return new ItemOperationBuilder(
      this.operations.concat([{ type: 'view-default-rendition' }])
    );
  }

  public clearRendition(): ItemOperationBuilder {
    return new ItemOperationBuilder(
      this.operations.concat([{ type: 'clear-rendition' }])
    );
  }

  public viewRepresentation(id: RepresentationId): ItemOperationBuilder {
    return new ItemOperationBuilder(
      this.operations.concat({ type: 'view-representation', id })
    );
  }

  public clearRepresentation(): ItemOperationBuilder {
    return new ItemOperationBuilder(
      this.operations.concat({ type: 'clear-representation' })
    );
  }
}
