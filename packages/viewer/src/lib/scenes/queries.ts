import { Point, Rectangle } from '@vertexvis/geometry';

import {
  PmiAnnotationOperationsBuilder,
  SceneItemOperationsBuilder,
} from './scene';

interface AllQueryExpression {
  type: 'all';
}

export interface SceneTreeRange {
  start: number;
  end: number;
}

export interface AnnotationQueryExpression {
  type: 'annotation-id';
  value: string;
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
  removeHiddenItems?: boolean;
}

interface AllSelectedQueryExpression {
  type: 'all-selected';
}

interface AllVisibleQueryExpression {
  type: 'all-visible';
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
  | AnnotationQueryExpression
  | ItemQueryExpression
  | AndExpression
  | OrExpression
  | SceneTreeRangeQueryExpression
  | PointQueryExpression
  | VolumeIntersectionQueryExpression
  | MetadataQueryExpression
  | AllSelectedQueryExpression
  | AllVisibleQueryExpression
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

interface AnnotationQuery<N> {
  withAnnotationId(id: string): N;
}

interface BooleanQuery {
  and(): AndSceneItemQuery;
  or(): OrSceneItemQuery;
}

interface BooleanAnnotationQuery {
  and(): AndAnnotationQuery;
  or(): OrAnnotationQuery;
}

export class RootQuery implements ItemQuery<SingleSceneItemQuery> {
  public constructor(private inverted: boolean = false) {}

  /**
   * Specifies that the operation should be performed on all items in the scene.
   *
   * @example
   * ```typescript
   * const viewer = document.querySelector('vertex-viewer');
   * const scene = await viewer.scene();
   *
   * // Deselect all items in the scene
   * await scene.elements((op) => [op.items.where((q) => q.all()).deselect()]).execute();
   * ```
   */
  public all(): AllQuery {
    return new AllQuery();
  }

  /**
   * Specifies that the operation should be performed on all items that do not match any following queries.
   *
   * @example
   * ```typescript
   * const viewer = document.querySelector('vertex-viewer');
   * const scene = await viewer.scene();
   *
   * // Hide all items that are not selected
   * await scene.elements((op) => [op.items.where((q) => q.not().withSelected()).hide()]).execute();
   * ```
   */
  public not(): RootQuery {
    return new NotSceneItemQuery(!this.inverted);
  }

  /**
   * Specifies that the operation should be performed on any item matching any one of the provided IDs.
   *
   * @example
   * ```typescript
   * const viewer = document.querySelector('vertex-viewer');
   * const scene = await viewer.scene();
   *
   * // Hide the item with the `item-uuid-1` ID and the `item-uuid-2` ID
   * await scene.elements((op) => [
   *   op.items.where((q) => q.withItemIds(['item-uuid-1', 'item-uuid-2'])).hide(),
   * ]).execute();
   * ```
   */
  public withItemIds(ids: string[]): BulkQuery {
    return new BulkQuery(ids, 'item-id', this.inverted);
  }

  /**
   * Specifies that the operation should be performed on any item matching any one of the provided custom supplied IDs.
   *
   * @example
   * ```typescript
   * const viewer = document.querySelector('vertex-viewer');
   * const scene = await viewer.scene();
   *
   * // Hide the item with the `item-supplied-id-1` supplied ID
   * // and the `item-supplied-id-2` supplied ID
   * await scene.elements((op) => [
   *   op
   *     .items.where((q) => q.withItemIds(['item-supplied-id-1', 'item-supplied-id-2']))
   *     .hide(),
   * ]).execute();
   * ```
   */
  public withSuppliedIds(ids: string[]): BulkQuery {
    return new BulkQuery(ids, 'supplied-id', this.inverted);
  }

  /**
   * Specifies that the operation should be performed on any item matching the provided ID.
   *
   * @example
   * ```typescript
   * const viewer = document.querySelector('vertex-viewer');
   * const scene = await viewer.scene();
   *
   * // Hide the item with the `item-uuid` ID
   * await scene.elements((op) => [
   *   op.items.where((q) => q.withItemId('item-uuid')).hide(),
   * ]).execute();
   * ```
   */
  public withItemId(id: string): SingleSceneItemQuery {
    return new SingleSceneItemQuery(
      { type: 'item-id', value: id },
      this.inverted
    );
  }

  /**
   * Specifies that the operation should be performed on any item matching the provided custom supplied ID.
   *
   * @example
   * ```typescript
   * const viewer = document.querySelector('vertex-viewer');
   * const scene = await viewer.scene();
   *
   * // Hide the item with the `item-supplied-id` supplied ID
   * await scene.elements((op) => [
   *   op.items.where((q) => q.withSuppliedId('item-supplied-id')).hide(),
   * ]).execute();
   * ```
   */
  public withSuppliedId(id: string): SingleSceneItemQuery {
    return new SingleSceneItemQuery(
      { type: 'supplied-id', value: id },
      this.inverted
    );
  }

  /**
   * Specifies that the operation should be performed on a range within the `<vertex-scene-tree>` component.
   *
   * @example
   * ```typescript
   * const viewer = document.querySelector('vertex-viewer');
   * const scene = await viewer.scene();
   *
   * // Hide all items from the 2nd row to the 5th row of the scene-tree
   * await scene.elements((op) => [
   *   op
   *     .items.where((q) =>
   *       q.withSceneTreeRange({
   *         start: 2,
   *         end: 5,
   *       })
   *     )
   *     .hide(),
   * ]).execute();
   * ```
   */
  public withSceneTreeRange(range: SceneTreeRange): SceneTreeRangeQuery {
    return new SceneTreeRangeQuery(range, this.inverted);
  }

  /**
   * Specifies that the operation should be performed on any item that has a metadata value matching the
   * filter provided for any of the keys specified. Can optionally be set to perform an exactMatch,
   * which will require that the filter matches the value exactly.
   *
   * @example
   * ```typescript
   * const viewer = document.querySelector('vertex-viewer');
   * const scene = await viewer.scene();
   *
   * // Hide all items where the `PART_NAME_KEY` includes a value of `PartName`
   * await scene.elements((op) => [
   *   op.items.where((q) => q.withMetadata('PartName', ['PART_NAME_KEY'])).hide(),
   * ]).execute();
   *
   * // Hide all items where the `PART_NAME_KEY` has exactly a value of `PartName`
   * await scene.elements((op) => [
   *   op.items.where((q) => q.withMetadata('PartName', ['PART_NAME_KEY'], true)).hide(),
   * ]).execute();
   * ```
   */
  public withMetadata(
    filter: string,
    keys: string[],
    exactMatch: boolean,
    removeHiddenItems?: boolean
  ): MetadataQuery {
    return new MetadataQuery(
      filter,
      keys,
      exactMatch,
      this.inverted,
      removeHiddenItems
    );
  }

  /**
   * Specifies that the operation should be performed on any item that has been selected.
   *
   * @example
   * ```typescript
   * const viewer = document.querySelector('vertex-viewer');
   * const scene = await viewer.scene();
   *
   * // Hide all items that are selected
   * await scene.elements((op) => [op.items.where((q) => q.withSelected()).hide()]).execute();
   * ```
   */
  public withSelected(): AllSelectedQuery {
    return new AllSelectedQuery(this.inverted);
  }

  /**
   * Specifies that the operation should be performed on any item that is visible.
   *
   * @example
   * ```typescript
   * const viewer = document.querySelector('vertex-viewer');
   * const scene = await viewer.scene();
   *
   * // Select all items that are visible
   * await scene.elements((op) => [op.items.where((q) => q.withVisible()).select()]).execute();
   * ```
   */
  public withVisible(): AllVisibleQuery {
    return new AllVisibleQuery(this.inverted);
  }

  /**
   * Specifies that the operation should be performed on any item present at the provided `point` in the image.
   * This query operates on the item found at that `point` similar to using `withItemId` in combination with
   * `raycaster.hitItems`, which can be useful if the additional metadata from the `raycaster.hitItems`
   * method is not needed to eliminate a network request.
   *
   * @example
   * ```typescript
   * const viewer = document.querySelector('vertex-viewer');
   * const scene = await viewer.scene();
   *
   * // Select the item present at the [100, 100] coordinate of the image
   * await scene.elements((op) => [
   *   op.items.where((q) => q.withPoint(Point.create(100, 100))).select(),
   * ]).execute();
   * ```
   */
  public withPoint(point: Point.Point): PointQuery {
    return new PointQuery(point, this.inverted);
  }

  /**
   * Specifies that the operation should be performed on items within the specified `rectangle` boundary 
   * within the Viewer. The `exclusive` flag here determines whether items that intersect with the `rectangle`, 
   * but are not contained should be included in the result.
   * 
   * @example
   * ```typescript
   * const viewer = document.querySelector('vertex-viewer');
   * const scene = await viewer.scene();

   * // Select all items within the specified 100x100 region of the image
   * // excluding any elements that are not fully contained by the region
   * await scene.elements((op) => [
   *   op
   *     .items.where((q) =>
   *       q.withVolumeIntersection(
   *         Rectangle.create(100, 100, 100, 100),
   *         true
   *       )
   *     )
   *     .hide(),
   * ]).execute();

   * // Select all items within the specified 100x100 region of the image
   * // including any elements that intersect with the region
   * await scene.elements((op) => [
   *   op
   *     .items.where((q) =>
   *       q.withVolumeIntersection(
   *         Rectangle.create(100, 100, 100, 100),
   *         false
   *       )
   *     )
   *     .hide(),
   * ]).execute();
   * ```
   */
  public withVolumeIntersection(
    rectangle: Rectangle.Rectangle,
    exclusive?: boolean
  ): VolumeIntersectionQuery {
    return new VolumeIntersectionQuery(rectangle, this.inverted, exclusive);
  }
}

export class NotSceneItemQuery extends RootQuery {
  public constructor(inverted: boolean) {
    super(inverted);
  }
}

export class PmiAnnotationRootQuery
  implements AnnotationQuery<SingleAnnotationQuery>
{
  public constructor(private inverted: boolean = false) {}

  /**
   * Specifies that the operation should be performed on all PMI annotations in the scene.
   *
   * @example
   * ```typescript
   * const viewer = document.querySelector('vertex-viewer');
   * const scene = await viewer.scene();
   *
   * // Deselect all PMI annotations in the scene
   * await scene.elements((op) => [op.annotations.where((q) => q.all()).deselect()]).execute();
   * ```
   */
  public all(): AllQuery {
    return new AllQuery();
  }

  /**
   * Specifies that the operation should be performed on all annotations that do not match any following queries.
   *
   * @example
   * ```typescript
   * const viewer = document.querySelector('vertex-viewer');
   * const scene = await viewer.scene();
   *
   * // Hide all PMI annotations that are not selected
   * await scene.elements((op) => [op.annotations.where((q) => q.not().withSelected()).hide()]).execute();
   * ```
   */
  public not(): PmiAnnotationRootQuery {
    return new NotAnnotationQuery(!this.inverted);
  }

  /**
   * Specifies that the operation should be performed on any annotation matching any one of the provided IDs.
   *
   * @example
   * ```typescript
   * const viewer = document.querySelector('vertex-viewer');
   * const scene = await viewer.scene();
   *
   * // Hide the annotation with the `item-uuid-1` ID and the `item-uuid-2` ID
   * await scene.elements((op) => [
   *   op.annotations.where((q) => q.withAnnotationIds(['item-uuid-1', 'item-uuid-2'])).hide(),
   * ]).execute();
   * ```
   */
  public withAnnotationIds(ids: string[]): BulkQuery {
    return new BulkQuery(ids, 'annotation-id', this.inverted);
  }

  /**
   * Specifies that the operation should be performed on any annotation matching the provided ID.
   *
   * @example
   * ```typescript
   * const viewer = document.querySelector('vertex-viewer');
   * const scene = await viewer.scene();
   *
   * // Hide the item with the `item-uuid` ID
   * await scene.elements((op) => [
   *   op.annotations.where((q) => q.withAnnotationId('item-uuid')).hide(),
   * ]).execute();
   * ```
   */
  public withAnnotationId(id: string): SingleAnnotationQuery {
    return new SingleAnnotationQuery(
      { type: 'annotation-id', value: id },
      this.inverted
    );
  }
}

export class NotAnnotationQuery extends PmiAnnotationRootQuery {
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
    inverted: boolean,
    private removeHiddenItems?: boolean
  ) {
    super(inverted);
  }

  public queryExpressionBuilder(): MetadataQueryExpression {
    return {
      type: 'metadata',
      filter: this.filter,
      keys: this.keys,
      exactMatch: this.exactMatch,
      removeHiddenItems: this.removeHiddenItems,
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

export class AllVisibleQuery extends TerminalQuery {
  public constructor(inverted: boolean) {
    super(inverted);
  }

  public queryExpressionBuilder(): AllVisibleQueryExpression {
    return {
      type: 'all-visible',
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
    private type: 'item-id' | 'supplied-id' | 'annotation-id',
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

class SingleSceneItemQuery extends TerminalQuery implements BooleanQuery {
  public constructor(private query: QueryExpression, inverted: boolean) {
    super(inverted);
  }

  public queryExpressionBuilder(): QueryExpression {
    return { ...this.query };
  }

  public and(): AndSceneItemQuery {
    return new AndSceneItemQuery([this.query], this.inverted);
  }

  public or(): OrSceneItemQuery {
    return new OrSceneItemQuery([this.query], this.inverted);
  }
}

export class OrSceneItemQuery
  extends TerminalQuery
  implements ItemQuery<OrSceneItemQuery>
{
  public constructor(
    private expressions: QueryExpression[],
    inverted: boolean
  ) {
    super(inverted);
  }

  public queryExpressionBuilder(): QueryExpression {
    return { type: 'or', expressions: [...this.expressions] };
  }

  public withItemId(id: string): OrSceneItemQuery {
    return new OrSceneItemQuery(
      [...this.expressions, { type: 'item-id', value: id }],
      this.inverted
    );
  }

  public withSuppliedId(id: string): OrSceneItemQuery {
    return new OrSceneItemQuery(
      [...this.expressions, { type: 'supplied-id', value: id }],
      this.inverted
    );
  }

  public or(): this {
    return this;
  }
}

export class AndSceneItemQuery
  extends TerminalQuery
  implements ItemQuery<AndSceneItemQuery>
{
  public constructor(
    private expressions: QueryExpression[],
    inverted: boolean
  ) {
    super(inverted);
  }

  public queryExpressionBuilder(): QueryExpression {
    return { type: 'and', expressions: [...this.expressions] };
  }

  public withItemId(id: string): AndSceneItemQuery {
    return new AndSceneItemQuery(
      [...this.expressions, { type: 'item-id', value: id }],
      this.inverted
    );
  }

  public withSuppliedId(id: string): AndSceneItemQuery {
    return new AndSceneItemQuery(
      [...this.expressions, { type: 'supplied-id', value: id }],
      this.inverted
    );
  }

  public and(): this {
    return this;
  }
}

class SingleAnnotationQuery
  extends TerminalQuery
  implements BooleanAnnotationQuery
{
  public constructor(private query: QueryExpression, inverted: boolean) {
    super(inverted);
  }

  public queryExpressionBuilder(): QueryExpression {
    return { ...this.query };
  }

  public and(): AndAnnotationQuery {
    return new AndAnnotationQuery([this.query], this.inverted);
  }

  public or(): OrAnnotationQuery {
    return new OrAnnotationQuery([this.query], this.inverted);
  }
}

export class OrAnnotationQuery
  extends TerminalQuery
  implements AnnotationQuery<OrAnnotationQuery>
{
  public constructor(
    private expressions: QueryExpression[],
    inverted: boolean
  ) {
    super(inverted);
  }

  public queryExpressionBuilder(): QueryExpression {
    return { type: 'or', expressions: [...this.expressions] };
  }

  public withAnnotationId(id: string): OrAnnotationQuery {
    return new OrAnnotationQuery(
      [...this.expressions, { type: 'annotation-id', value: id }],
      this.inverted
    );
  }

  public or(): this {
    return this;
  }
}

export class AndAnnotationQuery
  extends TerminalQuery
  implements AnnotationQuery<AndAnnotationQuery>
{
  public constructor(
    private expressions: QueryExpression[],
    inverted: boolean
  ) {
    super(inverted);
  }

  public queryExpressionBuilder(): QueryExpression {
    return { type: 'and', expressions: [...this.expressions] };
  }

  public withAnnotationId(id: string): AndAnnotationQuery {
    return new AndAnnotationQuery(
      [...this.expressions, { type: 'annotation-id', value: id }],
      this.inverted
    );
  }

  public and(): this {
    return this;
  }
}

export class SceneElementQueryExecutor {
  public get items(): SceneItemQueryExecutor {
    return new SceneItemQueryExecutor();
  }

  public get annotations(): PmiAnnotationsQueryExecutor {
    return new PmiAnnotationsQueryExecutor();
  }
}

export class PmiAnnotationsQueryExecutor {
  public where(
    query: (q: PmiAnnotationRootQuery) => TerminalQuery
  ): PmiAnnotationOperationsBuilder {
    const expression: QueryExpression = query(
      new PmiAnnotationRootQuery()
    ).build();
    return new PmiAnnotationOperationsBuilder(expression);
  }
}

export class SceneItemQueryExecutor {
  public where(
    query: (q: RootQuery) => TerminalQuery
  ): SceneItemOperationsBuilder {
    const expression: QueryExpression = query(new RootQuery()).build();

    return new SceneItemOperationsBuilder(expression);
  }
}
