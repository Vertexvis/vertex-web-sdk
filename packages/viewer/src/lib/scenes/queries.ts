import { Point, Rectangle } from '@vertexvis/geometry';

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

interface NotQueryExpression {
  type: 'not';
  query: QueryExpression;
}
interface MetadataQueryExpression {
  type: 'metadata';
  filter: string;
  keys: string[];
  exactMatch: boolean;
}

interface AllSelectedQueryExpression {
  type: 'all-selected';
}

interface PointQueryExpression {
  type: 'point';
  point: Point.Point;
}

interface VolumeIntersectionQueryExpression {
  type: 'volume-intersection';
  rectangle: Rectangle.Rectangle;
  exclusive: boolean;
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
  | PointQueryExpression
  | VolumeIntersectionQueryExpression
  | MetadataQueryExpression
  | AllSelectedQueryExpression
  | NotQueryExpression;

/**
 * An interface that represents a query is "complete" and can be turned into an
 * expression.
 */
abstract class TerminalQuery {
  protected inverted: boolean;
  public constructor(inverted: boolean) {
    this.inverted = inverted;
  }

  public build(): QueryExpression {
    if (this.inverted) {
      return {
        type: 'not',
        query: this.queryExpressionBuilder(),
      };
    } else {
      return this.queryExpressionBuilder();
    }
  }

  public abstract queryExpressionBuilder(): QueryExpression;
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
  public constructor(private inverted: boolean = false) {}
  public all(): AllQuery {
    return new AllQuery();
  }

  public not(): RootQuery {
    return new NotQuery(!this.inverted);
  }

  public withItemIds(ids: string[]): BulkQuery {
    return new BulkQuery(ids, 'item-id', this.inverted);
  }

  public withSuppliedIds(ids: string[]): BulkQuery {
    return new BulkQuery(ids, 'supplied-id', this.inverted);
  }

  public withItemId(id: string): SingleQuery {
    return new SingleQuery({ type: 'item-id', value: id }, this.inverted);
  }

  public withSuppliedId(id: string): SingleQuery {
    return new SingleQuery({ type: 'supplied-id', value: id }, this.inverted);
  }

  public withSceneTreeRange(range: SceneTreeRange): SceneTreeRangeQuery {
    return new SceneTreeRangeQuery(range, this.inverted);
  }

  public withMetadata(
    filter: string,
    keys: string[],
    exactMatch: boolean
  ): MetadataQuery {
    return new MetadataQuery(filter, keys, exactMatch, this.inverted);
  }

  public withSelected(): AllSelectedQuery {
    return new AllSelectedQuery(this.inverted);
  }

  public withPoint(point: Point.Point): PointQuery {
    return new PointQuery(point, this.inverted);
  }

  public withVolumeIntersection(
    rectangle: Rectangle.Rectangle,
    exclusive?: boolean
  ): VolumeIntersectionQuery {
    return new VolumeIntersectionQuery(rectangle, this.inverted, exclusive);
  }
}

export class NotQuery extends RootQuery {
  public constructor(inverted: boolean) {
    super(inverted);
  }
}

export class AllQuery extends TerminalQuery {
  public constructor(inverted = false) {
    super(inverted);
  }

  public queryExpressionBuilder(): QueryExpression {
    return { type: 'all' };
  }
}

export class SceneTreeRangeQuery extends TerminalQuery {
  public constructor(private range: SceneTreeRange, inverted: boolean) {
    super(inverted);
  }

  public queryExpressionBuilder(): SceneTreeRangeQueryExpression {
    return {
      type: 'scene-tree-range',
      range: this.range,
    };
  }
}

export class MetadataQuery extends TerminalQuery {
  public constructor(
    private filter: string,
    private keys: string[],
    private exactMatch: boolean,
    inverted: boolean
  ) {
    super(inverted);
  }

  public queryExpressionBuilder(): MetadataQueryExpression {
    return {
      type: 'metadata',
      filter: this.filter,
      keys: this.keys,
      exactMatch: this.exactMatch,
    };
  }
}

export class AllSelectedQuery extends TerminalQuery {
  public constructor(inverted: boolean) {
    super(inverted);
  }

  public queryExpressionBuilder(): AllSelectedQueryExpression {
    return {
      type: 'all-selected',
    };
  }
}

export class PointQuery extends TerminalQuery {
  public constructor(private point: Point.Point, inverted: boolean) {
    super(inverted);
  }

  public queryExpressionBuilder(): PointQueryExpression {
    return {
      type: 'point',
      point: this.point,
    };
  }
}

export class VolumeIntersectionQuery extends TerminalQuery {
  public constructor(
    private rectangle: Rectangle.Rectangle,
    inverted: boolean,
    private exclusive?: boolean
  ) {
    super(inverted);
  }

  public queryExpressionBuilder(): VolumeIntersectionQueryExpression {
    return {
      type: 'volume-intersection',
      rectangle: this.rectangle,
      exclusive: !!this.exclusive,
    };
  }
}

export class BulkQuery extends TerminalQuery {
  public constructor(
    private ids: string[],
    private type: 'item-id' | 'supplied-id',
    inverted: boolean
  ) {
    super(inverted);
  }

  public queryExpressionBuilder(): QueryExpression {
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

class SingleQuery extends TerminalQuery implements BooleanQuery {
  public constructor(private query: QueryExpression, inverted: boolean) {
    super(inverted);
  }

  public queryExpressionBuilder(): QueryExpression {
    return { ...this.query };
  }

  public and(): AndQuery {
    return new AndQuery([this.query], this.inverted);
  }

  public or(): OrQuery {
    return new OrQuery([this.query], this.inverted);
  }
}

export class OrQuery extends TerminalQuery implements ItemQuery<OrQuery> {
  public constructor(
    private expressions: QueryExpression[],
    inverted: boolean
  ) {
    super(inverted);
  }

  public queryExpressionBuilder(): QueryExpression {
    return { type: 'or', expressions: [...this.expressions] };
  }

  public withItemId(id: string): OrQuery {
    return new OrQuery(
      [...this.expressions, { type: 'item-id', value: id }],
      this.inverted
    );
  }

  public withSuppliedId(id: string): OrQuery {
    return new OrQuery(
      [...this.expressions, { type: 'supplied-id', value: id }],
      this.inverted
    );
  }

  public or(): OrQuery {
    return this;
  }
}

export class AndQuery extends TerminalQuery implements ItemQuery<AndQuery> {
  public constructor(
    private expressions: QueryExpression[],
    inverted: boolean
  ) {
    super(inverted);
  }

  public queryExpressionBuilder(): QueryExpression {
    return { type: 'and', expressions: [...this.expressions] };
  }

  public withItemId(id: string): AndQuery {
    return new AndQuery(
      [...this.expressions, { type: 'item-id', value: id }],
      this.inverted
    );
  }

  public withSuppliedId(id: string): AndQuery {
    return new AndQuery(
      [...this.expressions, { type: 'supplied-id', value: id }],
      this.inverted
    );
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
