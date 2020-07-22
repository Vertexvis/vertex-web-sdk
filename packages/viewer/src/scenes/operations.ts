import { SceneItemOperationsExecutor } from './scene';
import { ColorMaterial } from './colorMaterial';
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

export class ItemSelectorBuilder implements SelectorBuilder<AnySelector> {
  private query?: ItemSelector;
  private andOr?: Selector<OrSelector | AndSelector>;

  public build(): ItemSelector {
    console.log('andOr in item selector: ', this.andOr);
    console.log('this.query: ', this.query);
    if (this.query == null) {
      throw new Error('Cannot build selector. A selector has not been defined');
    }
    return this.query;
  }

  public or(): Selector<OrSelector> {
    const orSelector = new OrSelectorBuilder(this);
    this.andOr = orSelector;
    // this.builders.push(orSelector);
    return orSelector;
  }

  public and(): Selector<AndSelector> {
    const andSelector = new AndSelectorBuilder(this);
    // this.builders.push(andSelector);
    this.andOr = andSelector;
    return andSelector;
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

export type AnySelector = ItemSelector | AndSelector | OrSelector;

/**
 * A selector builder to perform boolean `or` operations.
 */

export class OrSelectorBuilder implements Selector<OrSelector> {
  private builders: Selector<ItemSelector>[] = [];

  public constructor(parent: Selector<ItemSelector>) {
    this.builders.push(parent);
  }

  public or(): Selector<OrSelector> {
    return this;
  }

  public and(): Selector<AndSelector> {
    throw new Error('Cannot use "and" in this context');
  }

  public withSuppliedId(suppliedId: string): this {
    this.builders.push(new ItemSelectorBuilder().withSuppliedId(suppliedId));
    return this;
  }

  public build(): OrSelector {
    return { type: 'or', selectors: this.builders.map(q => q.build()) };
  }

  public withItemId(partId: string): this {
    this.builders.push(new ItemSelectorBuilder().withItemId(partId));
    return this;
  }
}

/**
 * A selector builder to perform boolean `and` operations.
 */
export class AndSelectorBuilder implements Selector<AndSelector> {
  private builders: Selector<ItemSelector>[] = [];

  public constructor(parent: Selector<ItemSelector>) {
    this.builders.push(parent);
  }

  public build(): AndSelector {
    return { type: 'and', selectors: this.builders.map(q => q.build()) };
  }

  public or(): Selector<OrSelector> {
    throw new Error('Cannot use "or" in this context');
  }

  public and(): Selector<AndSelector> {
    return this;
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

export interface BuiltQuery {
  builders: Selector<AnySelector>[];
  query: ItemSelector;
}

interface OrSelector {
  type: 'or';
  selectors: ItemSelector[];
}

interface AndSelector {
  type: 'and';
  selectors: ItemSelector[];
}

export interface OperationDefinition {
  operation: ItemOperation;
}

export interface SelectorBuilder<T> extends Partial<Selector<T>> {
  /**
   * Returns the built selector.
   */
  build(): T;
}

export interface Selector<T> {
  /**
   * Returns a conditional builder to perform an `or` operation.
   */
  or(): Selector<OrSelector>;

  /**
   * Returns a conditional builder to perform an `or` operation.
   */
  and(): Selector<AndSelector>;

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

  build(): T;
}

export interface ChangeMaterialOperation {
  type: 'change-material';
  color: ColorMaterial;
}

export type ItemOperation =
  | ShowItemOperation
  | HideItemOperation
  | ChangeMaterialOperation;

export interface SceneItemQuery {
  where(
    query: (
      clientBuilder: Selector<ItemSelector>
    ) => SelectorBuilder<ItemSelector>
  ): SceneItemOperationsExecutor;
}

export interface SceneItemOperations<T> {
  materialOverride(color: ColorMaterial): T;
  show(): T;
  hide(): T;
}

export const selectorToBuilder = (
  selector: Selector<ItemSelector>
): SelectorBuilder<ItemSelector> => {
  throw new Error('Not Yet Implemented');
  // return {
  //   ...selector,
  //   build: () => {
  //     selector.
  //   }
  // }
};

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
