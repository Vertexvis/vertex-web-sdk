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

export type SelectorType =
  | 'and-selector'
  | 'or-selector'
  | 'internal-item-selector'
  | 'client-item-selector';

export interface BuiltQuery {
  items?: ItemSelector[];
  selectorType: SelectorType;
  query?: ItemSelector;
}

export class ItemSelectorBuilder implements SelectorBuilder<BuiltQuery> {
  private query?: ItemSelector;
  private orAndSelector?: ConditionSelectorBuilder<
    OrSelectorBuilder | AndSelectorBuilder
  >;

  public build(): BuiltQuery {
    if (this.orAndSelector != null) {
      return {
        selectorType: this.orAndSelector.getSelectorType(),
        items: this.orAndSelector
          .getBuilders()
          .map(itemBuilder => itemBuilder.build().query),
      };
    } else if (this.query != null) {
      return {
        query: this.query,
        selectorType: 'internal-item-selector',
      };
    }
    throw new Error('Cannot build selector. A selector has not been defined');
  }

  public or(): Selector<OrSelector> {
    this.orAndSelector = this.getItemSelectorBuilder('or');
    this.query = undefined;
    return this.orAndSelector as Selector<OrSelector>;
  }

  public and(): Selector<AndSelector> {
    this.orAndSelector = this.getItemSelectorBuilder('and');
    this.query = undefined;
    return this.orAndSelector as Selector<AndSelector>;
  }

  public withSuppliedId(suppliedId: string): this {
    this.query = { type: 'supplied-id', value: suppliedId };
    return this;
  }

  public withItemId(itemId: string): this {
    this.query = { type: 'item-id', value: itemId };
    return this;
  }

  public getSelectorType(): SelectorType {
    return 'internal-item-selector';
  }

  private getItemSelectorBuilder(
    type: string
  ): ConditionSelectorBuilder<OrSelectorBuilder | AndSelectorBuilder> {
    const itemSelectorCopy =
      this.query != null
        ? this.query.type === 'item-id'
          ? new ItemSelectorBuilder().withItemId(this.query.value)
          : new ItemSelectorBuilder().withSuppliedId(this.query.value)
        : this;
    if (type === 'and') {
      return new AndSelectorBuilder(itemSelectorCopy);
    } else if (type === 'or') {
      return new OrSelectorBuilder(itemSelectorCopy);
    }

    throw new Error('No type specified');
  }
}

/**
 * A selector builder to perform boolean `or` operations.
 */

export class OrSelectorBuilder implements ConditionSelectorBuilder<OrSelector> {
  private builders: ItemSelectorBuilder[] = [];

  public constructor(parent: ItemSelectorBuilder) {
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

  public withItemId(partId: string): this {
    this.builders.push(new ItemSelectorBuilder().withItemId(partId));
    return this;
  }

  public getSelectorType(): SelectorType {
    return 'or-selector';
  }

  public getBuilders(): ItemSelectorBuilder[] {
    return this.builders;
  }
}

/**
 * A selector builder to perform boolean `and` operations.
 */
export class AndSelectorBuilder
  implements ConditionSelectorBuilder<AndSelector> {
  private builders: ItemSelectorBuilder[] = [];

  public constructor(parent: ItemSelectorBuilder) {
    this.builders.push(parent);
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

  public getSelectorType(): SelectorType {
    return 'and-selector';
  }

  public getBuilders(): ItemSelectorBuilder[] {
    return this.builders;
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
  operation: ItemOperation;
}

export interface SelectorBuilder<T> extends Partial<Selector<T>> {
  /**
   * Returns the built selector.
   */
  build(): T;
}

export interface ConditionSelectorBuilder<T> extends Partial<Selector<T>> {
  /**
   * Returns the itemSelectors within the selector
   */
  getBuilders(): ItemSelectorBuilder[];
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

  /**
   * Returns the type of Selector so that the selector is defined by a type
   */
  getSelectorType(): SelectorType;
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
