import { SceneOperationBuilder } from '../operations';
import { ColorMaterial, fromHex } from '../colorMaterial';
import { Color } from '@vertexvis/utils';

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
      { type: 'change-material', color: materialOverride },
    ]);
  });

  it('create a select operation', () => {
    const material = fromHex('#ff0000');
    const builder = new SceneOperationBuilder();
    const definitions = builder.select(material).build();

    expect(definitions).toEqual([{ type: 'select', color: material }]);
  });

  it('create a deselect operation', () => {
    const builder = new SceneOperationBuilder();
    const definitions = builder.deselect().build();

    expect(definitions).toEqual([{ type: 'deselect' }]);
  });
});
