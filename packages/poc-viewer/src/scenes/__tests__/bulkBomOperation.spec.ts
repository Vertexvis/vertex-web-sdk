import { BomItemQuery } from '@vertexvis/vertex-api';
import {
  createBomItemQuery,
  createBulkBomOperationFromDefinition,
  dedupBulkBomOperations,
} from '../bulkBomOperations';
import { SceneOperationBuilder } from '../operations';
import { ItemSelectorBuilder } from '../selectors';

describe(createBomItemQuery, () => {
  it('metadata selector creates a Lucene search bom item query', () => {
    const selector = new ItemSelectorBuilder()
      .withMetadata('some cool key', 'some value with path/to/part')
      .build();
    const query = createBomItemQuery(selector);
    expect(query).toEqual({
      bomItemQueryType: BomItemQuery.BomItemQueryType.METADATA,
      key: 'some cool key',
      value: 'some value with path/to/part',
    });
  });

  it('item id selector creates part id bom item query', () => {
    const selector = new ItemSelectorBuilder().withItemId('item-id').build();
    const query = createBomItemQuery(selector);
    expect(query).toEqual({
      bomItemQueryType: BomItemQuery.BomItemQueryType.PART_ID,
      value: 'item-id',
    });
  });
});

describe(createBulkBomOperationFromDefinition, () => {
  it('if definition is or condition, should return a bom operation for each condition', () => {
    const builder = new SceneOperationBuilder();
    const def = builder
      .hide(s =>
        s
          .withItemId('1')
          .or()
          .withItemId('2')
      )
      .build();

    const op = createBulkBomOperationFromDefinition(def[0]);
    expect(op).toHaveLength(2);
  });

  it('should create single operation for non-conditional definition', () => {
    const builder = new SceneOperationBuilder();
    const def = builder.hide(s => s.withItemId('1')).build();
    const op = createBulkBomOperationFromDefinition(def[0]);
    expect(op).toEqual([
      {
        bomItemQuery: {
          bomItemQueryType: 'PART_ID',
          value: '1',
        },
        bomOperations: [{ type: 'hide' }],
      },
    ]);
  });

  it('creates highlight bulk bom operation', () => {
    const builder = new SceneOperationBuilder();
    const def = builder.highlight('#ff0000', s => s.withItemId('1')).build();
    const op = createBulkBomOperationFromDefinition(def[0]);

    expect(op).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          bomOperations: [{ type: 'highlight', hexColorString: '#ff0000' }],
        }),
      ])
    );
  });

  it('creates clear all highlight operation', () => {
    const builder = new SceneOperationBuilder();
    const def = builder.clearAllHighlights().build();
    const op = createBulkBomOperationFromDefinition(def[0]);

    expect(op).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          bomOperations: [{ type: 'clear_highlight_all' }],
        }),
      ])
    );
  });

  it('creates show all operation', () => {
    const builder = new SceneOperationBuilder();
    const def = builder.showAll().build();
    const op = createBulkBomOperationFromDefinition(def[0]);

    expect(op).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          bomOperations: [{ type: 'show_all' }],
        }),
      ])
    );
  });

  it('creates hide all operation', () => {
    const builder = new SceneOperationBuilder();
    const def = builder.hideAll().build();
    const op = createBulkBomOperationFromDefinition(def[0]);

    expect(op).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          bomOperations: [{ type: 'hide_all' }],
        }),
      ])
    );
  });
});

describe(dedupBulkBomOperations, () => {
  it('consolidates bom operations for the same query', () => {
    const builder = new SceneOperationBuilder();
    const def = builder
      .hide(s => s.withMetadata('name', 'test'))
      .show(s => s.withMetadata('name', 'test'))
      .highlight('#000000', s => s.withMetadata('name', 'test'))
      .build();
    const ops = dedupBulkBomOperations(
      def.reduce(
        (result, d) => [...result, ...createBulkBomOperationFromDefinition(d)],
        []
      )
    );

    expect(ops).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          bomItemQuery: {
            bomItemQueryType: BomItemQuery.BomItemQueryType.METADATA,
            key: 'name',
            value: 'test',
          },
          bomOperations: [
            { type: 'hide' },
            { type: 'show' },
            { type: 'highlight', hexColorString: '#000000' },
          ],
        }),
      ])
    );
  });
});
