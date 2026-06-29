import { Point } from '@vertexvis/geometry';
import { UUID } from '@vertexvis/utils';

import { PmiAnnotationRootQuery, RootQuery } from '../queries';

describe(RootQuery, () => {
  const itemId = UUID.create();
  const suppliedId = 'SomeSuppliedId';

  it('should support single withItemId selections', () => {
    const itemQueryBuilder = new RootQuery().withItemId(itemId.toString());

    expect(itemQueryBuilder.build()).toEqual({
      type: 'item-id',
      value: itemId.toString(),
    });
  });

  it('should support single withSuppliedId queries', () => {
    const itemQueryBuilder = new RootQuery().withSuppliedId(suppliedId);

    expect(itemQueryBuilder.build()).toEqual({
      type: 'supplied-id',
      value: suppliedId,
    });
  });

  it('should support query by all', () => {
    const itemQueryBuilder = new RootQuery().all();

    expect(itemQueryBuilder.build()).toEqual({
      type: 'all',
    });
  });

  it('should support not queries', () => {
    const notWithSelectedQuery = new RootQuery().not().withSelected();

    expect(notWithSelectedQuery.build()).toEqual({
      type: 'not',
      query: {
        type: 'all-selected',
      },
    });
  });

  it('should support nested not queries and remove redundancies', () => {
    const notWithSelectedQuery = new RootQuery()
      .not()
      .not()
      .withSuppliedId(suppliedId);

    expect(notWithSelectedQuery.build()).toEqual({
      type: 'supplied-id',
      value: suppliedId,
    });

    const notWithSelectedQueryNot = new RootQuery()
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
    const itemQueryBuilder = new RootQuery()
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
    const itemQueryBuilder = new RootQuery()
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
    const itemQueryBuilder = new RootQuery().withItemIds([
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

    const itemQuerySuppliedBuilder = new RootQuery().withSuppliedIds([
      suppliedId.toString(),
      suppliedId.toString(),
    ]);
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
    const itemQueryBuilder = new RootQuery().withPoint(point);

    expect(itemQueryBuilder.build()).toEqual({
      type: 'point',
      point,
    });
  });

  it('should support visibility queries for visible items', () => {
    const itemQueryBuilder = new RootQuery().withVisible();

    expect(itemQueryBuilder.build()).toEqual({
      type: 'all-visible',
    });
  });
});

describe(PmiAnnotationRootQuery, () => {
  const annotationId = UUID.create().toString();
  const annotationId2 = UUID.create().toString();

  it('should support single withAnnotationId selections', () => {
    const annotationQueryBuilder =
      new PmiAnnotationRootQuery().withAnnotationId(annotationId);

    expect(annotationQueryBuilder.build()).toEqual({
      type: 'annotation-id',
      value: annotationId,
    });
  });

  it('should support query by all', () => {
    const annotationQueryBuilder = new PmiAnnotationRootQuery().all();

    expect(annotationQueryBuilder.build()).toEqual({
      type: 'all',
    });
  });

  it('should support not queries', () => {
    const notWithIddQuery = new PmiAnnotationRootQuery()
      .not()
      .withAnnotationId(annotationId);

    expect(notWithIddQuery.build()).toEqual({
      type: 'not',
      query: {
        type: 'annotation-id',
        value: annotationId,
      },
    });
  });

  it('should support nested not queries and remove redundancies', () => {
    const notWithIdQuery = new PmiAnnotationRootQuery()
      .not()
      .not()
      .withAnnotationId(annotationId);

    expect(notWithIdQuery.build()).toEqual({
      type: 'annotation-id',
      value: annotationId,
    });

    const notWithIdQueryNot = new PmiAnnotationRootQuery()
      .not()
      .not()
      .not()
      .withAnnotationId(annotationId);

    expect(notWithIdQueryNot.build()).toEqual({
      type: 'not',
      query: {
        type: 'annotation-id',
        value: annotationId,
      },
    });
  });

  it('should support single or multiple queries', () => {
    const annotationQueryBuilder = new PmiAnnotationRootQuery()
      .withAnnotationId(annotationId)
      .or()
      .withAnnotationId(annotationId2);

    expect(annotationQueryBuilder.build()).toEqual({
      type: 'or',
      expressions: [
        {
          type: 'annotation-id',
          value: annotationId,
        },
        {
          type: 'annotation-id',
          value: annotationId2,
        },
      ],
    });
  });

  it('should support and queries', () => {
    const annotationQueryBuilder = new PmiAnnotationRootQuery()
      .withAnnotationId(annotationId)
      .and()
      .withAnnotationId(annotationId2);

    expect(annotationQueryBuilder.build()).toEqual({
      type: 'and',
      expressions: [
        {
          type: 'annotation-id',
          value: annotationId,
        },
        {
          type: 'annotation-id',
          value: annotationId2,
        },
      ],
    });
  });

  it('should support bulk queries', () => {
    const annotationQueryBuilder =
      new PmiAnnotationRootQuery().withAnnotationIds([
        annotationId,
        annotationId2,
      ]);

    expect(annotationQueryBuilder.build()).toEqual({
      type: 'or',
      expressions: [
        {
          type: 'annotation-id',
          value: annotationId,
        },
        {
          type: 'annotation-id',
          value: annotationId2,
        },
      ],
    });
  });
});
