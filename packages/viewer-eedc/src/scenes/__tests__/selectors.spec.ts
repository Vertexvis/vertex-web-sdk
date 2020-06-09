import { ItemSelectorBuilder, OrSelectorBuilder } from '../selectors';

describe(ItemSelectorBuilder, () => {
  describe(ItemSelectorBuilder.prototype.withMetadata, () => {
    it('should build a metadata selector', () => {
      const builder = new ItemSelectorBuilder();
      const selector = builder.withMetadata('key', 'value').build();
      expect(selector).toEqual({
        type: 'metadata',
        key: 'key',
        value: 'value',
      });
    });
  });

  describe(ItemSelectorBuilder.prototype.or, () => {
    it('should return a selector builder to join selectors', () => {
      const builder = new ItemSelectorBuilder();
      const selector = builder
        .withMetadata('key1', 'value1')
        .or()
        .withMetadata('key2', 'value2')
        .build();

      expect(selector).toEqual({
        type: 'or',
        selectors: [
          {
            type: 'metadata',
            key: 'key1',
            value: 'value1',
          },
          {
            type: 'metadata',
            key: 'key2',
            value: 'value2',
          },
        ],
      });
    });
  });
});

describe(OrSelectorBuilder, () => {
  describe(OrSelectorBuilder.prototype.or, () => {
    it('flattens chained composite selectors', () => {
      const builder = new OrSelectorBuilder(
        new ItemSelectorBuilder().withMetadata('key1', 'value2')
      );

      const selector = builder
        .withMetadata('key2', 'value2')
        .or()
        .withMetadata('key3', 'value3')
        .build();

      expect(selector.selectors).toHaveLength(3);
    });
  });
});
