import { newSpecPage } from '@stencil/core/testing';

import { SceneTreeToolbarGroup } from './scene-tree-toolbar-group';

describe('scene-tree-toolbar-group', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [SceneTreeToolbarGroup],
      html: `<vertex-scene-tree-toolbar-group></vertex-scene-tree-toolbar-group>`,
    });
    expect(page.root).toEqualHtml(`
      <vertex-scene-tree-toolbar-group>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </vertex-scene-tree-toolbar-group>
    `);
  });
});
