import { newSpecPage, SpecPage } from '@stencil/core/testing';
import { SceneTreeTableResizeDivider } from './scene-tree-table-resize-divider';

describe('<vertex-scene-tree-table-resize-divider>', () => {
  it('renders', async () => {
    const { divider } = await newComponentSpec({
      html: `
        <vertex-scene-tree-table-resize-divider>
        </vertex-scene-tree-table-resize-divider>
      `,
    });

    expect(divider.shadowRoot?.querySelector('div.divider')).not.toBeNull();
  });

  it('applies dragging styles', async () => {
    const { page, divider } = await newComponentSpec({
      html: `
        <vertex-scene-tree-table-resize-divider>
        </vertex-scene-tree-table-resize-divider>
      `,
    });

    expect(divider.getAttribute('style')).toContain(
      'height: var(--header-height)'
    );
    expect(divider.getAttribute('style')).toContain(
      'padding: calc(var(--header-height) / 8) calc(var(--scene-tree-table-column-gap) / 2)'
    );

    divider.dispatchEvent(new MouseEvent('pointerdown'));

    await page.waitForChanges();

    expect(divider.getAttribute('style')).toContain('height: 100%');
    expect(divider.getAttribute('style')).toContain(
      'padding: 0 calc(var(--scene-tree-table-column-gap) / 2)'
    );

    window.dispatchEvent(new MouseEvent('pointerup'));

    await page.waitForChanges();

    expect(divider.getAttribute('style')).toContain(
      'height: var(--header-height)'
    );
    expect(divider.getAttribute('style')).toContain(
      'padding: calc(var(--header-height) / 8) calc(var(--scene-tree-table-column-gap) / 2)'
    );
  });
});

async function newComponentSpec(data: { html: string }): Promise<{
  page: SpecPage;
  divider: HTMLVertexSceneTreeTableResizeDividerElement;
}> {
  const page = await newSpecPage({
    components: [SceneTreeTableResizeDivider],
    html: data.html,
  });
  const divider = page.root as HTMLVertexSceneTreeTableResizeDividerElement;

  return { page, divider };
}
