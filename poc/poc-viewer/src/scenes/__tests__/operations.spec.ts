import { SceneOperationBuilder } from '../operations';

describe(SceneOperationBuilder, () => {
  it('creates a clear all highlights operation', () => {
    const builder = new SceneOperationBuilder();
    const definitions = builder.clearAllHighlights().build();

    expect(definitions).toEqual([
      { operation: { type: 'clear_highlight_all' } },
    ]);
  });

  it('creates a show all operation', () => {
    const builder = new SceneOperationBuilder();
    const definitions = builder.showAll().build();

    expect(definitions).toEqual([{ operation: { type: 'show_all' } }]);
  });

  it('creates a hide all operation', () => {
    const builder = new SceneOperationBuilder();
    const definitions = builder.hideAll().build();

    expect(definitions).toEqual([{ operation: { type: 'hide_all' } }]);
  });

  it('creates a show operation', () => {
    const builder = new SceneOperationBuilder();
    const definitions = builder
      .show(s => s.withMetadata('key', 'value'))
      .build();

    expect(definitions).toEqual([
      {
        operation: { type: 'show' },
        selector: { type: 'metadata', key: 'key', value: 'value' },
      },
    ]);
  });

  it('creates a hide operation', () => {
    const builder = new SceneOperationBuilder();
    const definitions = builder
      .hide(s => s.withMetadata('key', 'value'))
      .build();

    expect(definitions).toEqual([
      {
        operation: { type: 'hide' },
        selector: { type: 'metadata', key: 'key', value: 'value' },
      },
    ]);
  });

  it('creates a highlight operation', () => {
    const builder = new SceneOperationBuilder();
    const definitions = builder
      .highlight('#ff0000', s => s.withMetadata('key', 'value'))
      .build();

    expect(definitions).toEqual([
      {
        operation: { type: 'highlight', color: '#ff0000' },
        selector: { type: 'metadata', key: 'key', value: 'value' },
      },
    ]);
  });
});
