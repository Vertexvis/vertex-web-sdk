jest.mock('../viewer/viewer');

import { newSpecPage } from '@stencil/core/testing';

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
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('fit all', () => {
    it('contains a fit all button', async () => {
      const page = await newSpecPage({
        components: [ViewerDefaultToolbar],
        html: `<vertex-viewer-default-toolbar></vertex-viewer-default-toolbar>`,
      });

      const btn = page.root?.shadowRoot?.querySelector(
        '[data-test-id="fit-all-btn"]'
      );
      expect(btn).toBeDefined();
    });

    it('performs fit all with animation when fit all button is clicked', async () => {
      const page = await newSpecPage({
        components: [ViewerDefaultToolbar],
        html: `<vertex-viewer-default-toolbar></vertex-viewer-default-toolbar>`,
      });

      page.rootInstance.viewer = viewer;
      await page.waitForChanges();

      const btn = page.root?.shadowRoot?.querySelector(
        '[data-test-id="fit-all-btn"]'
      );
      btn?.dispatchEvent(new MouseEvent('click'));

      await awaitScene;

      expect(cameraMock.viewAll).toHaveBeenCalled();
      expect(cameraMock.render).toHaveBeenCalledWith(
        expect.objectContaining({
          animation: { milliseconds: 1000 },
        })
      );
    });

    it('performs fit all without animation if disabled', async () => {
      const page = await newSpecPage({
        components: [ViewerDefaultToolbar],
        html: `<vertex-viewer-default-toolbar animations-disabled></vertex-viewer-default-toolbar>`,
      });

      page.rootInstance.viewer = viewer;
      await page.waitForChanges();

      const btn = page.root?.shadowRoot?.querySelector(
        '[data-test-id="fit-all-btn"]'
      );
      btn?.dispatchEvent(new MouseEvent('click'));

      await awaitScene;

      expect(cameraMock.render).toHaveBeenCalledWith(
        expect.objectContaining({
          animation: undefined,
        })
      );
    });
  });

  it('sets placement on shadow elements', async () => {
    const page = await newSpecPage({
      components: [ViewerDefaultToolbar],
      html: `<vertex-viewer-default-toolbar placement="top-left"></vertex-viewer-default-toolbar>`,
    });

    const toolbar = page.root?.shadowRoot?.querySelector(
      'vertex-viewer-toolbar'
    );
    expect(toolbar).toEqualAttribute('placement', 'top-left');
  });

  it('sets direction on shadow elements', async () => {
    const page = await newSpecPage({
      components: [ViewerDefaultToolbar],
      html: `<vertex-viewer-default-toolbar direction="vertical"></vertex-viewer-default-toolbar>`,
    });

    const toolbar = page.root?.shadowRoot?.querySelector(
      'vertex-viewer-toolbar'
    );
    expect(toolbar).toEqualAttribute('direction', 'vertical');

    page.root?.shadowRoot
      ?.querySelectorAll('vertex-viewer-toolbar-group')
      .forEach((group) => {
        expect(group.dataset.direction).toBe('vertical');
        expect(group).toEqualAttribute('direction', 'vertical');
      });
  });
});
