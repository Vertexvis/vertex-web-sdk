import { ItemSelectorBuilder } from '../selectors';
import { UUID } from '@vertexvis/utils';

describe(ItemSelectorBuilder, () => {
  const itemId = UUID.create();
  const suppliedId = 'SomeSuppliedId';

  it('should support single withItemId selections', () => {
    const itemSelectorBuilder = new ItemSelectorBuilder().withItemId(
      itemId.toString()
    );

    expect(itemSelectorBuilder.build()).toEqual({
      query: {
        type: 'item-id',
        value: itemId.toString(),
      },
      selectorType: 'internal-item-selector',
    });
  });

  it('should support single withSuppliedId selections', () => {
    const itemSelectorBuilder = new ItemSelectorBuilder().withSuppliedId(
      suppliedId
    );

    expect(itemSelectorBuilder.build()).toEqual({
      query: {
        type: 'supplied-id',
        value: suppliedId,
      },
      selectorType: 'internal-item-selector',
    });
  });

  it('should support single or selections', () => {
    const itemSelectorBuilder: ItemSelectorBuilder = new ItemSelectorBuilder();
    itemSelectorBuilder
      .withItemId(itemId.toString())
      .or()
      .withSuppliedId(suppliedId);

    expect(itemSelectorBuilder.build()).toEqual({
      query: undefined,
      items: [
        {
          type: 'item-id',
          value: itemId.toString(),
        },
        {
          value: suppliedId,
          type: 'supplied-id',
        },
      ],
      selectorType: 'or-selector',
    });
  });

  it('should support single and selections', () => {
    const itemSelectorBuilder: ItemSelectorBuilder = new ItemSelectorBuilder();
    itemSelectorBuilder
      .withItemId(itemId.toString())
      .and()
      .withSuppliedId(suppliedId);

    expect(itemSelectorBuilder.build()).toEqual({
      query: undefined,
      items: [
        {
          type: 'item-id',
          value: itemId.toString(),
        },
        {
          value: suppliedId,
          type: 'supplied-id',
        },
      ],
      selectorType: 'and-selector',
    });
  });
});
