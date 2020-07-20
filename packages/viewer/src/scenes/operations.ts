import { SceneItemOperationsExecutor } from './scene';

interface ShowItemOperation {
  type: 'show';
}

interface HideItemOperation {
  type: 'hide';
}

interface SuppliedIdSelector {
  type: 'supplied-id';
  value: string;
}

interface ItemIdSelector {
  type: 'item-id';
  value: string;
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

  public and(): SelectorBuilder<AndSelector> {
    return new AndSelectorBuilder(this);
  }

  public withSuppliedId(suppliedId: string): this {
    this.query = { type: 'supplied-id', value: suppliedId };
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

  private parent: SelectorBuilder<ItemSelector>;
  public constructor(parent: SelectorBuilder<ItemSelector>) {
    this.builders.push(parent);
    this.parent = parent;
  }

  public or(): SelectorBuilder<OrSelector> {
    return this;
  }

  public and(): SelectorBuilder<AndSelector> {
    return new AndSelectorBuilder(this.parent);
  }

  public build(): OrSelector {
    return { type: 'or', selectors: this.builders.map(q => q.build()) };
  }

  public withSuppliedId(suppliedId: string): this {
    this.builders.push(new ItemSelectorBuilder().withSuppliedId(suppliedId));
    return this;
  }

  public withItemId(partId: string): this {
    this.builders.push(new ItemSelectorBuilder().withItemId(partId));
    return this;
  }
}

/**
 * A selector builder to perform boolean `and` operations.
 */
export class AndSelectorBuilder implements SelectorBuilder<AndSelector> {
  private builders?: SelectorBuilder<ItemSelector>[] = [];
  private parent: SelectorBuilder<ItemSelector>;
  public constructor(parent: SelectorBuilder<ItemSelector>) {
    this.builders.push(parent);
    this.parent = parent;
  }

  public or(): SelectorBuilder<OrSelector> {
    return new OrSelectorBuilder(this.parent);
  }

  public and(): SelectorBuilder<AndSelector> {
    return this;
  }

  public build(): AndSelector {
    return { type: 'and', selectors: this.builders.map(q => q.build()) };
  }

  public withSuppliedId(suppliedId: string): this {
    this.builders.push(new ItemSelectorBuilder().withSuppliedId(suppliedId));
    return this;
  }

  public withItemId(partId: string): this {
    this.builders.push(new ItemSelectorBuilder().withItemId(partId));
    return this;
  }
}

/**
 * An `ItemSelector` describes a type for performing a selection against some
 * attribute of a scene item.
 */
export type ItemSelector = SuppliedIdSelector | ItemIdSelector;

interface OrSelector {
  type: 'or';
  selectors: ItemSelector[];
}

interface AndSelector {
  type: 'and';
  selectors: ItemSelector[];
}

export interface OperationDefinition {
  operation: ItemOperation | SceneOperation;
}

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
   * Returns a conditional builder to perform an `or` operation.
   */
  and(): SelectorBuilder<AndSelector>;

  /**
   * Selects a item that has the given Customer facing ID
   *
   * @param suppliedId The customer ID of an item to match
   */
  withSuppliedId(suppliedId: string): this;

  /**
   * Selects a item that has the given Vertex ID.
   *
   * @param itemId The ID of the item to match.
   */
  withItemId(itemId: string): this;
}

interface ChangeMaterialOperation {
  type: 'change-material';
  color: string;
}

export type SceneOperation = ChangeMaterialOperation;

export type ItemOperation = ShowItemOperation | HideItemOperation;

export interface SceneItemQuery {
  where(
    query: SelectorBuilder<ItemSelectorBuilder>
  ): SceneItemOperationsExecutor;
}

export interface SceneItemOperations<T> {
  material(color: string): T;
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

  public material(color: string): SceneOperationBuilder {
    return this.operation({ type: 'change-material', color });
  }

  public show(): SceneOperationBuilder {
    return this.operation({ type: 'show' });
  }

  public hide(): SceneOperationBuilder {
    return this.operation({ type: 'hide' });
  }

  private operation(operation: SceneOperation): SceneOperationBuilder;
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

export class SceneQueryBuilder implements SceneItemQuery {
  private query: SelectorBuilder<ItemSelectorBuilder> | undefined;

  public where(
    _query: SelectorBuilder<ItemSelectorBuilder>
  ): SceneItemOperationsExecutor {
    this.query = _query;
    return new SceneItemOperationsExecutor(null, this.query);
  }
}
