import { Point } from '@vertexvis/geometry';
import { UUID } from '@vertexvis/utils';

import { SceneAlterationQuery } from '../queries';

describe(SceneAlterationQuery, () => {
  const itemId = UUID.create();
  const suppliedId = 'SomeSuppliedId';

  it('should support single withItemId selections', () => {
    const itemQueryBuilder = new SceneAlterationQuery().withItemId(
      itemId.toString()
    );

    expect(itemQueryBuilder.build()).toEqual({
      type: 'item-id',
      value: itemId.toString(),
    });
  });

  it('should support single withSuppliedId queries', () => {
    const itemQueryBuilder = new SceneAlterationQuery().withSuppliedId(
      suppliedId
    );

    expect(itemQueryBuilder.build()).toEqual({
      type: 'supplied-id',
      value: suppliedId,
    });
  });

  it('should support query by all', () => {
    const itemQueryBuilder = new SceneAlterationQuery().all();

    expect(itemQueryBuilder.build()).toEqual({
      type: 'all',
    });
  });

  it('should support not queries', () => {
    const notWithSelectedQuery = new SceneAlterationQuery()
      .not()
      .withSelected();

    expect(notWithSelectedQuery.build()).toEqual({
      type: 'not',
      query: {
        type: 'all-selected',
      },
    });
  });

  it('should support nested not queries and remove redundancies', () => {
    const notWithSelectedQuery = new SceneAlterationQuery()
      .not()
      .not()
      .withSuppliedId(suppliedId);

    expect(notWithSelectedQuery.build()).toEqual({
      type: 'supplied-id',
      value: suppliedId,
    });

    const notWithSelectedQueryNot = new SceneAlterationQuery()
      .not()
      .not()
      .not()
      .withSuppliedId(suppliedId);

    expect(notWithSelectedQueryNot.build()).toEqual({
      type: 'not',
      query: {
        type: 'supplied-id',
        value: suppliedId,
      },
    });
  });

  it('should support single or multiple queries', () => {
    const itemQueryBuilder = new SceneAlterationQuery()
      .withItemId(itemId.toString())
      .or()
      .withSuppliedId(suppliedId);

    expect(itemQueryBuilder.build()).toEqual({
      type: 'or',
      expressions: [
        {
          type: 'item-id',
          value: itemId.toString(),
        },
        {
          value: suppliedId,
          type: 'supplied-id',
        },
      ],
    });
  });

  it('should support and queries', () => {
    const itemQueryBuilder = new SceneAlterationQuery()
      .withItemId(itemId.toString())
      .and()
      .withSuppliedId(suppliedId);

    expect(itemQueryBuilder.build()).toEqual({
      type: 'and',
      expressions: [
        {
          type: 'item-id',
          value: itemId.toString(),
        },
        {
          value: suppliedId,
          type: 'supplied-id',
        },
      ],
    });
  });

  it('should support bulk queries', () => {
    const itemQueryBuilder = new SceneAlterationQuery().withItemIds([
      itemId.toString(),
      itemId.toString(),
    ]);

    expect(itemQueryBuilder.build()).toEqual({
      type: 'or',
      expressions: [
        {
          type: 'item-id',
          value: itemId.toString(),
        },
        {
          type: 'item-id',
          value: itemId.toString(),
        },
      ],
    });

    const itemQuerySuppliedBuilder = new SceneAlterationQuery().withSuppliedIds(
      [suppliedId.toString(), suppliedId.toString()]
    );
    expect(itemQuerySuppliedBuilder.build()).toEqual({
      type: 'or',
      expressions: [
        {
          value: suppliedId,
          type: 'supplied-id',
        },
        {
          value: suppliedId,
          type: 'supplied-id',
        },
      ],
    });
  });

  it('should support point queries', () => {
    const point = Point.create(50, 50);
    const itemQueryBuilder = new SceneAlterationQuery().withPoint(point);

    expect(itemQueryBuilder.build()).toEqual({
      type: 'point',
      point,
    });
  });

  it('should support visibility queries for visible items', () => {
    const itemQueryBuilder = new SceneAlterationQuery().withVisible();

    expect(itemQueryBuilder.build()).toEqual({
      type: 'all-visible',
    });
  });
});
