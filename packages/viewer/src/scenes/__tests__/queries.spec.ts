import { RootQuery } from '../queries';
import { UUID } from '@vertexvis/utils';

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
});
