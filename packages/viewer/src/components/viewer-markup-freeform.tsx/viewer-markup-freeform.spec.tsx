jest.mock('../viewer/utils');
jest.mock('../viewer-markup/dom');

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';
import { Point, Rectangle } from '@vertexvis/geometry';

import { getMarkupBoundingClientRect } from '../viewer-markup/dom';
import { ViewerMarkupFreeform } from './viewer-markup-freeform';

describe('vertex-viewer-markup-freeform', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let interactionTargetListeners: any[] = [];
  const addEventListener = jest.fn((_, listener) => {
    interactionTargetListeners = [...interactionTargetListeners, listener];
  });
  const removeEventListener = jest.fn((_, listener) => {
    interactionTargetListeners = interactionTargetListeners.filter(
      (l) => l !== listener
    );
  });
  const viewer = {
    getInteractionTarget: jest.fn(() => ({
      addEventListener,
      removeEventListener,
    })),
  };
  const points = [
    Point.create(0, 0),
    Point.create(0, -0.5),
    Point.create(0, 0),
    Point.create(0, 0),
    Point.create(-0.5, 0),
    Point.create(0, 0),
  ];
  const bounds = Rectangle.create(-0.5, -0.5, 0.5, 0.5);
  (getMarkupBoundingClientRect as jest.Mock).mockReturnValue({
    left: 0,
    top: 0,
    bottom: 0,
    right: 0,
    width: 100,
    height: 100,
  });

  beforeEach(() => {
    interactionTargetListeners = [];
    jest.clearAllMocks();
  });

  it('positions the anchors correctly', async () => {
    const page = await newSpecPage({
      components: [ViewerMarkupFreeform],
      template: () => (
        <vertex-viewer-markup-freeform
          points={points}
          bounds={bounds}
          mode="edit"
        ></vertex-viewer-markup-freeform>
      ),
    });

    const el = page.root as HTMLVertexViewerMarkupFreeformElement;
    const leftEl = el?.shadowRoot?.getElementById(
      'bounding-box-2d-left-anchor'
    );
    const rightEl = el?.shadowRoot?.getElementById(
      'bounding-box-2d-right-anchor'
    );
    const topEl = el?.shadowRoot?.getElementById('bounding-box-2d-top-anchor');
    const bottomEl = el?.shadowRoot?.getElementById(
      'bounding-box-2d-bottom-anchor'
    );
    const topLeftEl = el?.shadowRoot?.getElementById(
      'bounding-box-2d-top-left-anchor'
    );
    const topRightEl = el?.shadowRoot?.getElementById(
      'bounding-box-2d-top-right-anchor'
    );
    const bottomLeftEl = el?.shadowRoot?.getElementById(
      'bounding-box-2d-bottom-left-anchor'
    );
    const bottomRightEl = el?.shadowRoot?.getElementById(
      'bounding-box-2d-bottom-right-anchor'
    );
    const centerEl = el?.shadowRoot?.getElementById(
      'bounding-box-2d-center-anchor'
    );

    /**
     * Shape after padding has bounds of `[-6, -6, 62, 62]`.
     */

    expect(leftEl?.getAttribute('style')).toContain('left: -6px');
    expect(leftEl?.getAttribute('style')).toContain('top: 25px');
    expect(rightEl?.getAttribute('style')).toContain('left: 56px');
    expect(rightEl?.getAttribute('style')).toContain('top: 25px');
    expect(bottomEl?.getAttribute('style')).toContain('left: 25px');
    expect(bottomEl?.getAttribute('style')).toContain('top: 56px');
    expect(topEl?.getAttribute('style')).toContain('left: 25px');
    expect(topEl?.getAttribute('style')).toContain('top: -6px');

    expect(topLeftEl?.getAttribute('style')).toContain('left: -6px');
    expect(topLeftEl?.getAttribute('style')).toContain('top: -6px');
    expect(topRightEl?.getAttribute('style')).toContain('left: 56px');
    expect(topRightEl?.getAttribute('style')).toContain('top: -6px');
    expect(bottomLeftEl?.getAttribute('style')).toContain('left: -6px');
    expect(bottomLeftEl?.getAttribute('style')).toContain('top: 56px');
    expect(bottomRightEl?.getAttribute('style')).toContain('left: 56px');
    expect(bottomRightEl?.getAttribute('style')).toContain('top: 56px');

    expect(centerEl?.getAttribute('style')).toContain('left: 25px');
    expect(centerEl?.getAttribute('style')).toContain('top: 25px');
  });

  it('handles resizes', async () => {
    const page = await newSpecPage({
      components: [ViewerMarkupFreeform],
      template: () => (
        <vertex-viewer-markup-freeform
          points={points}
          bounds={bounds}
          mode="edit"
        ></vertex-viewer-markup-freeform>
      ),
    });

    const el = page.root as HTMLVertexViewerMarkupFreeformElement;
    const leftEl = el?.shadowRoot?.getElementById(
      'bounding-box-2d-left-anchor'
    );
    const rightEl = el?.shadowRoot?.getElementById(
      'bounding-box-2d-right-anchor'
    );
    const topEl = el?.shadowRoot?.getElementById('bounding-box-2d-top-anchor');
    const bottomEl = el?.shadowRoot?.getElementById(
      'bounding-box-2d-bottom-anchor'
    );
    const topLeftEl = el?.shadowRoot?.getElementById(
      'bounding-box-2d-top-left-anchor'
    );
    const topRightEl = el?.shadowRoot?.getElementById(
      'bounding-box-2d-top-right-anchor'
    );
    const bottomLeftEl = el?.shadowRoot?.getElementById(
      'bounding-box-2d-bottom-left-anchor'
    );
    const bottomRightEl = el?.shadowRoot?.getElementById(
      'bounding-box-2d-bottom-right-anchor'
    );
    const centerEl = el?.shadowRoot?.getElementById(
      'bounding-box-2d-center-anchor'
    );

    /**
     * Padding to bounding box results in the anchor being
     * positioned +/-6 from the `clientX` or `clientY` values,
     * then offset by `4`.
     */
    rightEl?.dispatchEvent(new MouseEvent('pointerdown'));
    window.dispatchEvent(
      new MouseEvent('pointermove', {
        clientX: 75,
        clientY: 0,
      })
    );
    window.dispatchEvent(new MouseEvent('pointerup'));
    await page.waitForChanges();
    expect(rightEl?.getAttribute('style')).toContain('left: 81px');
    expect(rightEl?.getAttribute('style')).toContain('top: 25px');

    bottomRightEl?.dispatchEvent(new MouseEvent('pointerdown'));
    window.dispatchEvent(
      new MouseEvent('pointermove', {
        clientX: 100,
        clientY: 100,
      })
    );
    window.dispatchEvent(new MouseEvent('pointerup'));
    await page.waitForChanges();
    expect(bottomRightEl?.getAttribute('style')).toContain('left: 106px');
    expect(bottomRightEl?.getAttribute('style')).toContain('top: 106px');

    topRightEl?.dispatchEvent(new MouseEvent('pointerdown'));
    window.dispatchEvent(
      new MouseEvent('pointermove', {
        clientX: 90,
        clientY: 10,
      })
    );
    window.dispatchEvent(new MouseEvent('pointerup'));
    await page.waitForChanges();
    expect(topRightEl?.getAttribute('style')).toContain('left: 96px');
    expect(topRightEl?.getAttribute('style')).toContain('top: 4px');

    leftEl?.dispatchEvent(new MouseEvent('pointerdown'));
    window.dispatchEvent(
      new MouseEvent('pointermove', {
        clientX: 50,
        clientY: 50,
      })
    );
    window.dispatchEvent(new MouseEvent('pointerup'));
    await page.waitForChanges();
    expect(leftEl?.getAttribute('style')).toContain('left: 44px');
    expect(leftEl?.getAttribute('style')).toContain('top: 55px');

    topLeftEl?.dispatchEvent(new MouseEvent('pointerdown'));
    window.dispatchEvent(
      new MouseEvent('pointermove', {
        clientX: 60,
        clientY: 20,
      })
    );
    window.dispatchEvent(new MouseEvent('pointerup'));
    await page.waitForChanges();
    expect(topLeftEl?.getAttribute('style')).toContain('left: 54px');
    expect(topLeftEl?.getAttribute('style')).toContain('top: 14px');

    bottomLeftEl?.dispatchEvent(new MouseEvent('pointerdown'));
    window.dispatchEvent(
      new MouseEvent('pointermove', {
        clientX: 40,
        clientY: 90,
      })
    );
    window.dispatchEvent(new MouseEvent('pointerup'));
    await page.waitForChanges();
    expect(bottomLeftEl?.getAttribute('style')).toContain('left: 34px');
    expect(bottomLeftEl?.getAttribute('style')).toContain('top: 96px');

    topEl?.dispatchEvent(new MouseEvent('pointerdown'));
    window.dispatchEvent(
      new MouseEvent('pointermove', {
        clientX: 50,
        clientY: 30,
      })
    );
    window.dispatchEvent(new MouseEvent('pointerup'));
    await page.waitForChanges();
    expect(topEl?.getAttribute('style')).toContain('left: 65px');
    expect(topEl?.getAttribute('style')).toContain('top: 24px');

    bottomEl?.dispatchEvent(new MouseEvent('pointerdown'));
    window.dispatchEvent(
      new MouseEvent('pointermove', {
        clientX: 50,
        clientY: 80,
      })
    );
    window.dispatchEvent(new MouseEvent('pointerup'));
    await page.waitForChanges();
    expect(bottomEl?.getAttribute('style')).toContain('left: 65px');
    expect(bottomEl?.getAttribute('style')).toContain('top: 86px');

    /**
     * Circle should have its top left corner at this point at [40, 30],
     * with a width and height of 50px, placing the center at [65, 55].
     */

    centerEl?.dispatchEvent(
      new MouseEvent('pointerdown', {
        clientX: 65,
        clientY: 55,
      })
    );
    window.dispatchEvent(
      new MouseEvent('pointermove', {
        clientX: 50,
        clientY: 50,
      })
    );
    window.dispatchEvent(new MouseEvent('pointerup'));
    await page.waitForChanges();

    /**
     * Circle should have its top left corner at this point at [25, 25],
     * with a width and height of 50px, placing the center at [50, 50].
     */
    expect(centerEl?.getAttribute('style')).toContain('left: 50px');
    expect(centerEl?.getAttribute('style')).toContain('top: 50px');

    expect(rightEl?.getAttribute('style')).toContain('left: 81px');
    expect(rightEl?.getAttribute('style')).toContain('top: 50px');
    expect(bottomRightEl?.getAttribute('style')).toContain('left: 81px');
    expect(bottomRightEl?.getAttribute('style')).toContain('top: 81px');
    expect(topRightEl?.getAttribute('style')).toContain('left: 81px');
    expect(topRightEl?.getAttribute('style')).toContain('top: 19px');
    expect(leftEl?.getAttribute('style')).toContain('left: 19px');
    expect(leftEl?.getAttribute('style')).toContain('top: 50px');
    expect(topLeftEl?.getAttribute('style')).toContain('left: 19px');
    expect(topLeftEl?.getAttribute('style')).toContain('top: 19px');
    expect(bottomLeftEl?.getAttribute('style')).toContain('left: 19px');
    expect(bottomLeftEl?.getAttribute('style')).toContain('top: 81px');
    expect(topEl?.getAttribute('style')).toContain('left: 50px');
    expect(topEl?.getAttribute('style')).toContain('top: 19px');
    expect(bottomEl?.getAttribute('style')).toContain('left: 50px');
    expect(bottomEl?.getAttribute('style')).toContain('top: 81px');
  });

  it('should cancel markup editing if no movement occurs', async () => {
    const onEditCancel = jest.fn();
    await newSpecPage({
      components: [ViewerMarkupFreeform],
      template: () => (
        <vertex-viewer-markup-freeform
          mode="create"
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          viewer={viewer as any}
          onEditCancel={onEditCancel}
        ></vertex-viewer-markup-freeform>
      ),
    });

    interactionTargetListeners.forEach((l) => l(new MouseEvent('pointerdown')));

    window.dispatchEvent(new MouseEvent('pointerup'));

    expect(onEditCancel).toHaveBeenCalled();
  });

  it('removes event listeners when the viewer changes', async () => {
    const newViewer = {
      getInteractionTarget: jest.fn(),
    };
    const page = await newSpecPage({
      components: [ViewerMarkupFreeform],
      template: () => (
        <vertex-viewer-markup-freeform
          mode="create"
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          viewer={viewer as any}
        ></vertex-viewer-markup-freeform>
      ),
    });

    const el = page.root as HTMLVertexViewerMarkupFreeformElement;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    el.viewer = newViewer as any;
    await page.waitForChanges();

    expect(removeEventListener).toHaveBeenCalledWith(
      'pointerdown',
      expect.anything()
    );
  });

  it('removes event listeners when disposed', async () => {
    const page = await newSpecPage({
      components: [ViewerMarkupFreeform],
      template: () => (
        <vertex-viewer-markup-freeform
          mode="create"
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          viewer={viewer as any}
        ></vertex-viewer-markup-freeform>
      ),
    });

    const el = page.root as HTMLVertexViewerMarkupFreeformElement;
    el.dispose();
    await page.waitForChanges();

    expect(removeEventListener).toHaveBeenCalledWith(
      'pointerdown',
      expect.anything()
    );
  });
});
