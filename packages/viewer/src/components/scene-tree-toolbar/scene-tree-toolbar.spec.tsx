import { newSpecPage } from '@stencil/core/testing';
import { SceneTreeToolbar } from './scene-tree-toolbar';

describe('scene-tree-toolbar', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [SceneTreeToolbar],
      html: `<scene-tree-toolbar></scene-tree-toolbar>`,
    });
    expect(page.root).toEqualHtml(`
      <scene-tree-toolbar>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </scene-tree-toolbar>
    `);
  });
});
