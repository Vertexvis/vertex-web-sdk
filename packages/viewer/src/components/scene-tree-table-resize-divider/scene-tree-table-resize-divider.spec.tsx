import './scene-tree-table-resize-divider';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h } from '@stencil/vitest';

import { renderSource as render } from '#test/render-spec-page';

describe('<vertex-scene-tree-table-resize-divider>', () => {
  it('renders and applies dragging styles', async () => {
    const { root, waitForChanges } = await render(
      <vertex-scene-tree-table-resize-divider></vertex-scene-tree-table-resize-divider>,
    );
    const divider = root as HTMLVertexSceneTreeTableResizeDividerElement;
    expect(divider.shadowRoot?.querySelector('div.divider')).not.toBeNull();

    expect(divider.getAttribute('style')).toContain(
      'height: var(--header-height)',
    );
    expect(divider.getAttribute('style')).toContain(
      'padding: calc(var(--header-height) / 8) calc(var(--scene-tree-table-column-gap) / 2)',
    );

    divider.dispatchEvent(new MouseEvent('pointerdown'));

    await waitForChanges();

    expect(divider.getAttribute('style')).toContain('height: 100%');
    expect(divider.getAttribute('style')).toContain(
      'padding: 0px calc(var(--scene-tree-table-column-gap) / 2)',
    );

    window.dispatchEvent(new MouseEvent('pointerup'));

    await waitForChanges();

    expect(divider.getAttribute('style')).toContain(
      'height: var(--header-height)',
    );
    expect(divider.getAttribute('style')).toContain(
      'padding: calc(var(--header-height) / 8) calc(var(--scene-tree-table-column-gap) / 2)',
    );
  });
});
