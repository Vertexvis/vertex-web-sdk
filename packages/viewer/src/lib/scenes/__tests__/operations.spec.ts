import { Color } from '@vertexvis/utils';

import { random } from '../../../testing/random';
import { ColorMaterial } from '../colorMaterial';
import { SceneOperationBuilder } from '../operations';

describe(SceneOperationBuilder, () => {
  it('creates a hide operation', () => {
    const builder = new SceneOperationBuilder([]);
    const definitions = builder.hide().build();

    expect(definitions).toEqual([{ type: 'hide' }]);
  });

  it('creates a clear operation', () => {
    const builder = new SceneOperationBuilder();
    const definitions = builder.clearMaterialOverrides().build();

    expect(definitions).toEqual([{ type: 'clear-override' }]);
  });

  it('creates a show operation', () => {
    const builder = new SceneOperationBuilder();
    const definitions = builder.show().build();

    expect(definitions).toEqual([{ type: 'show' }]);
  });

  it('creates a change-material operation', () => {
    const builder = new SceneOperationBuilder();
    const materialOverride: ColorMaterial = {
      opacity: 100,
      glossiness: 100,
      ambient: Color.create(1, 2, 3),
      diffuse: Color.create(1, 2, 3),
      specular: Color.create(1, 2, 3),
      emissive: Color.create(1, 2, 3),
    };
    const definitions = builder.materialOverride(materialOverride).build();

    expect(definitions).toEqual([
      { type: 'change-material', material: materialOverride },
    ]);
  });

  it('create a select operation', () => {
    const builder = new SceneOperationBuilder();
    const definitions = builder.select().build();

    expect(definitions).toEqual([{ type: 'select' }]);
  });

  it('create a deselect operation', () => {
    const builder = new SceneOperationBuilder();
    const definitions = builder.deselect().build();

    expect(definitions).toEqual([{ type: 'deselect' }]);
  });

  it('creates a clear transform operation', () => {
    const builder = new SceneOperationBuilder();
    const definitions = builder.clearTransforms().build();

    expect(definitions).toEqual([{ type: 'clear-transform', cascade: true }]);
  });

  it('creates a change phantom operation with phantomState parameter', () => {
    const builder = new SceneOperationBuilder();
    const definitions = builder.setPhantom(true).build();

    expect(definitions).toEqual([
      { type: 'change-phantom', phantomState: true },
    ]);
  });

  it('creates a change phantom operation without parameter', () => {
    const builder = new SceneOperationBuilder();
    const definitions = builder.setPhantom().build();

    expect(definitions).toEqual([{ type: 'change-phantom' }]);
  });

  it('creates a clear phantom operation', () => {
    const builder = new SceneOperationBuilder();
    const definitions = builder.clearPhantom().build();

    expect(definitions).toEqual([{ type: 'clear-phantom' }]);
  });

  it('creates a change end item operation with endItemState parameter', () => {
    const builder = new SceneOperationBuilder();
    const definitions = builder.setEndItem(true).build();

    expect(definitions).toEqual([
      { type: 'change-end-item', endItemState: true },
    ]);
  });

  it('creates a change end item operation without parameter', () => {
    const builder = new SceneOperationBuilder();
    const definitions = builder.setEndItem().build();

    expect(definitions).toEqual([{ type: 'change-end-item' }]);
  });

  it('creates a clear end item operation', () => {
    const builder = new SceneOperationBuilder();
    const definitions = builder.clearEndItem().build();

    expect(definitions).toEqual([{ type: 'clear-end-item' }]);
  });

  it('creates rendition operations', () => {
    const id = random.guid();
    const suppliedId = random.string();

    const builder = new SceneOperationBuilder();
    const definitions = builder
      .viewRenditionById(id)
      .viewRenditionBySuppliedId(suppliedId)
      .viewDefaultRendition()
      .clearRendition()
      .viewRepresentation('empty')
      .viewRepresentation('entire-part')
      .viewRepresentation(id)
      .clearRepresentation()
      .build();

    expect(definitions).toEqual([
      { type: 'view-rendition-by-id', id },
      { type: 'view-rendition-by-supplied-id', suppliedId },
      { type: 'view-default-rendition' },
      { type: 'clear-rendition' },
      { type: 'view-representation', id: 'empty' },
      { type: 'view-representation', id: 'entire-part' },
      { type: 'view-representation', id },
      { type: 'clear-representation' },
    ]);
  });
});
