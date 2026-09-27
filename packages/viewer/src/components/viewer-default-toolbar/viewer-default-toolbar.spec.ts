vi.mock('../viewer/viewer');

import { h } from '@stencil/core';

import { renderSpecPage } from '#test/render-spec-page';

import {
  awaitScene,
  cameraMock,
  resetAwaiter,
  sceneMock,
  viewer,
} from '../viewer/__mocks__/mocks';
import { ViewerDefaultToolbar } from './viewer-default-toolbar';

describe('<vertex-viewer-default-toolbar>', () => {
  beforeEach(() => {
    resetAwaiter(sceneMock);
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe('fit all', () => {
    it('contains a fit all button', async () => {
      const page = await renderSpecPage({
        components: [ViewerDefaultToolbar],
        html: `<vertex-viewer-default-toolbar></vertex-viewer-default-toolbar>`,
      });

      const btn = page.root?.shadowRoot?.querySelector(
        '[data-testid="fit-all-btn"]',
      );
      expect(btn).toBeDefined();
      expect(btn).toEqualAttribute('aria-label', 'Fit all');
    });

    it('performs fit all with animation when fit all button is clicked', async () => {
      const page = await renderSpecPage({
        components: [ViewerDefaultToolbar],
        template: () => h('vertex-viewer-default-toolbar', { viewer }),
      });

      const btn = page.root?.shadowRoot?.querySelector(
        '[data-testid="fit-all-btn"]',
      );
      btn?.dispatchEvent(new MouseEvent('click'));

      await awaitScene;

      expect(cameraMock.viewAll).toHaveBeenCalled();
      expect(cameraMock.render).toHaveBeenCalledWith(
        expect.objectContaining({
          animation: { milliseconds: 1000 },
        }),
      );
    });

    it('performs fit all without animation if disabled', async () => {
      const page = await renderSpecPage({
        components: [ViewerDefaultToolbar],
        template: () =>
          h('vertex-viewer-default-toolbar', {
            animationsDisabled: true,
            viewer,
          }),
      });

      const btn = page.root?.shadowRoot?.querySelector(
        '[data-testid="fit-all-btn"]',
      );
      btn?.dispatchEvent(new MouseEvent('click'));

      await awaitScene;

      expect(cameraMock.render).toHaveBeenCalledWith(
        expect.objectContaining({
          animation: undefined,
        }),
      );
    });
  });

  it('sets placement on shadow elements', async () => {
    const page = await renderSpecPage({
      components: [ViewerDefaultToolbar],
      html: `<vertex-viewer-default-toolbar placement="top-left"></vertex-viewer-default-toolbar>`,
    });

    const toolbar = page.root?.shadowRoot?.querySelector(
      'vertex-viewer-toolbar',
    );
    expect((toolbar as HTMLVertexViewerToolbarElement).placement).toBe(
      'top-left',
    );
  });

  it('sets direction on shadow elements', async () => {
    const page = await renderSpecPage({
      components: [ViewerDefaultToolbar],
      html: `<vertex-viewer-default-toolbar direction="vertical"></vertex-viewer-default-toolbar>`,
    });

    const toolbar = page.root?.shadowRoot?.querySelector(
      'vertex-viewer-toolbar',
    );
    expect((toolbar as HTMLVertexViewerToolbarElement).direction).toBe(
      'vertical',
    );

    page.root?.shadowRoot
      ?.querySelectorAll('vertex-viewer-toolbar-group')
      .forEach((group) => {
        expect(group.dataset.direction).toBe('vertical');
        expect((group as HTMLVertexViewerToolbarGroupElement).direction).toBe(
          'vertical',
        );
      });
  });
});
