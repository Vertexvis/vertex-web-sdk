import { newSpecPage } from '@stencil/core/testing';
import { ViewerViewCube } from './viewer-view-cube';
import {
  sceneMock,
  cameraMock,
  viewer,
  resetAwaiter,
  awaitScene,
} from '../viewer/__mocks__/mocks';
import { Vector3 } from '@vertexvis/geometry';
import { StandardView } from '../../lib/types';

describe('<vertex-viewer-view-cube>', () => {
  beforeEach(() => {
    resetAwaiter(sceneMock);
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('renders cube with default labels', async () => {
    const page = await newSpecPage({
      components: [ViewerViewCube],
      html: `<vertex-viewer-view-cube></vertex-viewer-view-cube>`,
    });

    const front = page.root?.shadowRoot?.querySelector('.cube-face-front');
    const back = page.root?.shadowRoot?.querySelector('.cube-face-back');
    const left = page.root?.shadowRoot?.querySelector('.cube-face-left');
    const right = page.root?.shadowRoot?.querySelector('.cube-face-right');
    const top = page.root?.shadowRoot?.querySelector('.cube-face-top');
    const bottom = page.root?.shadowRoot?.querySelector('.cube-face-bottom');

    expect(front?.textContent).toBe('Front');
    expect(back?.textContent).toBe('Back');
    expect(left?.textContent).toBe('Left');
    expect(right?.textContent).toBe('Right');
    expect(top?.textContent).toBe('Top');
    expect(bottom?.textContent).toBe('Bottom');
  });

  it('renders cube with custom labels', async () => {
    const page = await newSpecPage({
      components: [ViewerViewCube],
      html: `
      <vertex-viewer-view-cube
        x-positive-label="xpos"
        x-negative-label="xneg"
      >
      </vertex-viewer-view-cube>`,
    });

    const left = page.root?.shadowRoot?.querySelector('.cube-face-left');
    const right = page.root?.shadowRoot?.querySelector('.cube-face-right');

    expect(left?.textContent).toBe('xneg');
    expect(right?.textContent).toBe('xpos');
  });

  it('sets hovered selector when mouse entered', async () => {
    const page = await newSpecPage({
      components: [ViewerViewCube],
      html: `<vertex-viewer-view-cube></vertex-viewer-view-cube>`,
    });

    const el = page.root?.shadowRoot?.getElementById('top-front');
    el?.dispatchEvent(new MouseEvent('mouseenter'));

    await page.waitForChanges();

    expect(el?.className).toContain('hovered');
  });

  it('removes hovered selector when mouse leave', async () => {
    const page = await newSpecPage({
      components: [ViewerViewCube],
      html: `<vertex-viewer-view-cube></vertex-viewer-view-cube>`,
    });

    const el = page.root?.shadowRoot?.getElementById('top-front');
    el?.dispatchEvent(new MouseEvent('mouseenter'));
    await page.waitForChanges();

    el?.dispatchEvent(new MouseEvent('mouseleave'));
    await page.waitForChanges();

    expect(el?.className).not.toContain('hovered');
  });

  it('performs standard view when side clicked', async () => {
    const page = await newSpecPage({
      components: [ViewerViewCube],
      html: `<vertex-viewer-view-cube></vertex-viewer-view-cube>`,
    });

    page.rootInstance.viewer = viewer;

    const frontEl = page.root?.shadowRoot?.getElementById('front');
    frontEl?.dispatchEvent(new MouseEvent('mousedown'));

    await awaitScene;

    expect(cameraMock.standardView).toHaveBeenCalledWith(StandardView.FRONT);
    expect(cameraMock.viewAll).toHaveBeenCalled();
    expect(cameraMock.render).toHaveBeenCalledWith(
      expect.objectContaining({
        animation: expect.objectContaining({
          milliseconds: 500,
        }),
      })
    );
  });

  it('will not animate standard view if animation duration is 0', async () => {
    const page = await newSpecPage({
      components: [ViewerViewCube],
      html: `<vertex-viewer-view-cube animation-duration="0"></vertex-viewer-view-cube>`,
    });

    page.rootInstance.viewer = viewer;

    const frontEl = page.root?.shadowRoot?.getElementById('front');
    frontEl?.dispatchEvent(new MouseEvent('mousedown'));

    await awaitScene;

    expect(cameraMock.render).toHaveBeenCalledWith({});
  });

  it('does not perform standard view if disabled', async () => {
    const page = await newSpecPage({
      components: [ViewerViewCube],
      html: `<vertex-viewer-view-cube standard-views-disabled></vertex-viewer-view-cube>`,
    });

    page.rootInstance.viewer = viewer;

    const frontEl = page.root?.shadowRoot?.getElementById('front');
    frontEl?.dispatchEvent(new MouseEvent('mousedown'));

    await viewer.scene();
    await awaitScene;

    expect(cameraMock.render).not.toHaveBeenCalled();
  });
});
