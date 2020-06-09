import { Point, Dimensions } from '@vertexvis/geometry';
import { HitDetection } from '@vertexvis/vertex-api';
import { Camera } from '@vertexvis/graphics3d';

interface MetadataSelector {
  type: 'metadata';
  key: string;
  value: string;
}

interface ItemIdSelector {
  type: 'item-id';
  value: string;
}

interface OrSelector {
  type: 'or';
  selectors: ItemSelector[];
}

/**
 * @private used internally or for testing purposes.
 */
export interface PositionSelector {
  type: 'position';
  hitRequestBody: HitDetection.HitsByPixelBody;
}

/**
 * A `ConditionalSelector` describes a type for performing a boolean selection
 * against other conditions.
 */
export type ConditionalSelector = OrSelector;

/**
 * An `ItemSelector` describes a type for performing a selection against some
 * attribute of a scene item.
 */
export type ItemSelector = MetadataSelector | ItemIdSelector;

/**
 * A `Selector` describes all selector types.
 */
export type Selector = ItemSelector | ConditionalSelector | PositionSelector;

/**
 * The `SelectorBuilder` interface defines a fluent interface for building a
 * selector that is used for querying scene items to perform an operation on.
 */
export interface SelectorBuilder<T> {
  /**
   * Returns the built selector.
   */
  build(): T;

  /**
   * Returns a conditional builder to perform an `or` operation.
   */
  or(): SelectorBuilder<OrSelector>;

  /**
   * Selects a part that contains the given key/value pair in its metadata.
   *
   * @param key A key to match.
   * @param value A value to match.
   */
  withMetadata(key: string, value: string): this;

  /**
   * Selects a item that has the given Vertex ID.
   *
   * @param itemId The ID of the item to match.
   */
  withItemId(itemId: string): this;
}

/**
 * @private used internally or for testing purposes.
 */
export class PositionSelectorBuilder
  implements SelectorBuilder<PositionSelector> {
  public constructor(
    private position: Point.Point,
    private camera: Camera.Camera,
    private viewport: Dimensions.Dimensions
  ) {}

  public build(): PositionSelector {
    return {
      type: 'position',
      hitRequestBody: this.toHitRequestBody(),
    };
  }

  public or(): SelectorBuilder<OrSelector> {
    throw new Error('No-op');
  }

  public withMetadata(key: string, value: string): this {
    throw new Error('No-op');
  }

  public withItemId(itemId: string): this {
    throw new Error('No-op');
  }

  private toHitRequestBody(): HitDetection.HitsByPixelBody {
    return {
      camera: this.camera,
      viewport: this.viewport,
      position: this.position,
    };
  }
}

/**
 * A selector builder that matches at an item level.
 */
export class ItemSelectorBuilder implements SelectorBuilder<ItemSelector> {
  private query?: ItemSelector;

  public build(): ItemSelector {
    if (this.query == null) {
      throw new Error('Cannot build selector. A selector has not been defined');
    }
    return this.query;
  }

  public or(): SelectorBuilder<OrSelector> {
    return new OrSelectorBuilder(this);
  }

  public withMetadata(key: string, value: string): this {
    this.query = { type: 'metadata', key, value };
    return this;
  }

  public withItemId(itemId: string): this {
    this.query = { type: 'item-id', value: itemId };
    return this;
  }
}

/**
 * A selector builder to perform boolean `or` operations.
 */
export class OrSelectorBuilder implements SelectorBuilder<OrSelector> {
  private builders?: SelectorBuilder<ItemSelector>[] = [];

  public constructor(parent: SelectorBuilder<ItemSelector>) {
    this.builders.push(parent);
  }

  public or(): SelectorBuilder<OrSelector> {
    return this;
  }

  public build(): OrSelector {
    return { type: 'or', selectors: this.builders.map(q => q.build()) };
  }

  public withMetadata(key: string, value: string): this {
    this.builders.push(new ItemSelectorBuilder().withMetadata(key, value));
    return this;
  }

  public withItemId(partId: string): this {
    this.builders.push(new ItemSelectorBuilder().withItemId(partId));
    return this;
  }
}
