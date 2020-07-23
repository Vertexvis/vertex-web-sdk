import { SceneItemOperationsExecutor } from './scene';

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
  private orAndSelector?: ConditionSelectorBuilder;

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

  public or(): Selector {
    this.orAndSelector = this.getItemSelectorBuilder('or');
    this.query = undefined;
    return this.orAndSelector as Selector;
  }

  public and(): Selector {
    this.orAndSelector = this.getItemSelectorBuilder('and');
    this.query = undefined;
    return this.orAndSelector as Selector;
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

  private getItemSelectorBuilder(type: string): ConditionSelectorBuilder {
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

export class OrSelectorBuilder implements ConditionSelectorBuilder {
  private builders: ItemSelectorBuilder[] = [];

  public constructor(parent: ItemSelectorBuilder) {
    this.builders.push(parent);
  }

  public or(): Selector {
    return this;
  }

  public and(): Selector {
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
export class AndSelectorBuilder implements ConditionSelectorBuilder {
  private builders: ItemSelectorBuilder[] = [];

  public constructor(parent: ItemSelectorBuilder) {
    this.builders.push(parent);
  }

  public or(): Selector {
    throw new Error('Cannot use "or" in this context');
  }

  public and(): Selector {
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

export interface SceneItemQuery {
  where(
    query: (clientBuilder: Selector) => SelectorBuilder<ItemSelector>
  ): SceneItemOperationsExecutor;
}

export interface SelectorBuilder<T> extends Selector {
  /**
   * Returns the built selector.
   */
  build(): T;
}

export interface ConditionSelectorBuilder extends Partial<Selector> {
  /**
   * Returns the itemSelectors within the selector
   */
  getBuilders(): ItemSelectorBuilder[];
}

export interface Selector {
  /**
   * Returns a conditional builder to perform an `or` operation.
   */
  or(): Selector;

  /**
   * Returns a conditional builder to perform an `or` operation.
   */
  and(): Selector;

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
