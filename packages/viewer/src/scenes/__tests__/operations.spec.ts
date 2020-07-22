import { SceneOperationBuilder } from '../operations';
import { ColorMaterial } from '../colorMaterial';
import { Color } from '@vertexvis/utils';

describe(SceneOperationBuilder, () => {
  it('creates a hide operation', () => {
    const builder = new SceneOperationBuilder();
    const definitions = builder.hide().build();

    expect(definitions).toEqual([{ operation: { type: 'hide' } }]);
  });

  it('creates a show operation', () => {
    const builder = new SceneOperationBuilder();
    const definitions = builder.show().build();

    expect(definitions).toEqual([{ operation: { type: 'show' } }]);
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
      { operation: { type: 'change-material', color: materialOverride } },
    ]);
  });
});
