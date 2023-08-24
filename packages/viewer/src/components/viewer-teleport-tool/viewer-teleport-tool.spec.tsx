// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';

import { ViewerTeleportTool } from './viewer-teleport-tool';

describe('vertex-viewer-teleport-tool', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [ViewerTeleportTool],
      template: () => (
        <vertex-viewer-teleport-tool></vertex-viewer-teleport-tool>
      ),
    });

    expect(page.root).toBeDefined();
  });
});
