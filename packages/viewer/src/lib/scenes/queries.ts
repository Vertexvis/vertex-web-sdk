import { ColorMaterial } from './colorMaterial';
import { SceneItemOperationsBuilder } from './scene';

interface AllQueryExpression {
  type: 'all';
}

export interface SceneTreeRange {
  start: number;
  end: number;
}

interface ItemQueryExpression {
  type: 'item-id' | 'supplied-id';
  value: string;
}

export interface AndExpression {
  type: 'and';
  expressions: QueryExpression[];
}

export interface OrExpression {
  type: 'or';
  expressions: QueryExpression[];
}

interface SceneTreeRangeQueryExpression {
  type: 'scene-tree-range';
  range: SceneTreeRange;
}

interface MetadataQueryExpression {
  type: 'metadata';
  filter: string;
  keys: string[];
}

interface AllSelectedQueryExpression {
  type: 'all-selected';
  material?: ColorMaterial;
}

/**
 * Represents the sum of all possible types of expressions.
 */
export type QueryExpression =
  | AllQueryExpression
  | ItemQueryExpression
  | AndExpression
  | OrExpression
  | SceneTreeRangeQueryExpression
  | MetadataQueryExpression
  | AllSelectedQueryExpression;

/**
 * An interface that represents a query is "complete" and can be turned into an
 * expression.
 */
interface TerminalQuery {
  build(): QueryExpression;
}

interface ItemQuery<N> {
  withItemId(id: string): N;

  withSuppliedId(id: string): N;
}

interface BooleanQuery {
  and(): AndQuery;
  or(): OrQuery;
}

export class RootQuery implements ItemQuery<SingleQuery> {
  public all(): AllQuery {
    return new AllQuery();
  }

  public withItemIds(ids: string[]): BulkQuery {
    return new BulkQuery(ids, 'item-id');
  }

  public withSuppliedIds(ids: string[]): BulkQuery {
    return new BulkQuery(ids, 'supplied-id');
  }

  public withItemId(id: string): SingleQuery {
    return new SingleQuery({ type: 'item-id', value: id });
  }

  public withSuppliedId(id: string): SingleQuery {
    return new SingleQuery({ type: 'supplied-id', value: id });
  }

  public withSceneTreeRange(range: SceneTreeRange): SceneTreeRangeQuery {
    return new SceneTreeRangeQuery(range);
  }

  public withMetadata(filter: string, keys: string[]): MetadataQuery {
    return new MetadataQuery(filter, keys);
  }

  public withSelected(color?: ColorMaterial): AllSelectedQuery {
    return new AllSelectedQuery(color);
  }
}

export class AllQuery implements TerminalQuery {
  public build(): QueryExpression {
    return { type: 'all' };
  }
}

export class SceneTreeRangeQuery implements TerminalQuery {
  public constructor(private range: SceneTreeRange) {}

  public build(): SceneTreeRangeQueryExpression {
    return {
      type: 'scene-tree-range',
      range: this.range,
    };
  }
}

export class MetadataQuery implements TerminalQuery {
  public constructor(private filter: string, private keys: string[]) {}

  public build(): MetadataQueryExpression {
    return {
      type: 'metadata',
      filter: this.filter,
      keys: this.keys,
    };
  }
}

export class AllSelectedQuery implements TerminalQuery {
  public constructor(private material?: ColorMaterial) {}

  public build(): AllSelectedQueryExpression {
    return {
      type: 'all-selected',
      material: this.material,
    };
  }
}

export class BulkQuery implements TerminalQuery {
  public constructor(
    private ids: string[],
    private type: 'item-id' | 'supplied-id'
  ) {}

  public build(): QueryExpression {
    return {
      type: 'or',
      expressions: this.ids.map((id) => {
        return {
          type: this.type,
          value: id,
        };
      }),
    };
  }
}

class SingleQuery implements TerminalQuery, BooleanQuery {
  public constructor(private query: QueryExpression) {}

  public build(): QueryExpression {
    return { ...this.query };
  }

  public and(): AndQuery {
    return new AndQuery([this.query]);
  }

  public or(): OrQuery {
    return new OrQuery([this.query]);
  }
}

export class OrQuery implements TerminalQuery, ItemQuery<OrQuery> {
  public constructor(private expressions: QueryExpression[]) {}

  public build(): QueryExpression {
    return { type: 'or', expressions: [...this.expressions] };
  }

  public withItemId(id: string): OrQuery {
    return new OrQuery([...this.expressions, { type: 'item-id', value: id }]);
  }

  public withSuppliedId(id: string): OrQuery {
    return new OrQuery([
      ...this.expressions,
      { type: 'supplied-id', value: id },
    ]);
  }

  public or(): OrQuery {
    return this;
  }
}

export class AndQuery implements TerminalQuery, ItemQuery<AndQuery> {
  public constructor(private expressions: QueryExpression[]) {}

  public build(): QueryExpression {
    return { type: 'and', expressions: [...this.expressions] };
  }

  public withItemId(id: string): AndQuery {
    return new AndQuery([...this.expressions, { type: 'item-id', value: id }]);
  }

  public withSuppliedId(id: string): AndQuery {
    return new AndQuery([
      ...this.expressions,
      { type: 'supplied-id', value: id },
    ]);
  }

  public and(): AndQuery {
    return this;
  }
}

export class SceneItemQueryExecutor {
  public constructor(private defaultSelectionMaterial: ColorMaterial) {}

  public where(
    query: (q: RootQuery) => TerminalQuery
  ): SceneItemOperationsBuilder {
    const expression: QueryExpression = query(new RootQuery()).build();

    return new SceneItemOperationsBuilder(
      expression,
      this.defaultSelectionMaterial
    );
  }
}
