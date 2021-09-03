jest.mock('../viewer/utils');
jest.mock('../viewer-markup/dom');

import '../../testing/domMocks';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';
import { Rectangle } from '@vertexvis/geometry';
import { ViewerMarkupCircle } from './viewer-markup-circle';
import { getMarkupBoundingClientRect } from '../viewer-markup/dom';

describe('vertex-viewer-markup-circle', () => {
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
      components: [ViewerMarkupCircle],
      template: () => (
        <vertex-viewer-markup-circle
          bounds={bounds}
          mode="edit"
        ></vertex-viewer-markup-circle>
      ),
    });

    const el = page.root as HTMLVertexViewerMarkupCircleElement;
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
     * Circle after padding has bounds of `[-6, -6, 62, 62]`.
     * Side anchors are offset by `-4`.
     */

    expect(leftEl?.getAttribute('x')).toBe('-10');
    expect(leftEl?.getAttribute('y')).toBe('21');
    expect(rightEl?.getAttribute('x')).toBe('52');
    expect(rightEl?.getAttribute('y')).toBe('21');
    expect(bottomEl?.getAttribute('x')).toBe('21');
    expect(bottomEl?.getAttribute('y')).toBe('52');
    expect(topEl?.getAttribute('x')).toBe('21');
    expect(topEl?.getAttribute('y')).toBe('-10');

    expect(topLeftEl?.getAttribute('x')).toBe('-10');
    expect(topLeftEl?.getAttribute('y')).toBe('-10');
    expect(topRightEl?.getAttribute('x')).toBe('52');
    expect(topRightEl?.getAttribute('y')).toBe('-10');
    expect(bottomLeftEl?.getAttribute('x')).toBe('-10');
    expect(bottomLeftEl?.getAttribute('y')).toBe('52');
    expect(bottomRightEl?.getAttribute('x')).toBe('52');
    expect(bottomRightEl?.getAttribute('y')).toBe('52');

    expect(centerEl?.getAttribute('cx')).toBe('25');
    expect(centerEl?.getAttribute('cy')).toBe('25');
  });

  it('handles resizes', async () => {
    const page = await newSpecPage({
      components: [ViewerMarkupCircle],
      template: () => (
        <vertex-viewer-markup-circle
          bounds={bounds}
          mode="edit"
        ></vertex-viewer-markup-circle>
      ),
    });

    const el = page.root as HTMLVertexViewerMarkupCircleElement;
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
    expect(rightEl?.getAttribute('x')).toBe('77');
    expect(rightEl?.getAttribute('y')).toBe('21');

    bottomRightEl?.dispatchEvent(new MouseEvent('pointerdown'));
    window.dispatchEvent(
      new MouseEvent('pointermove', {
        clientX: 100,
        clientY: 100,
      })
    );
    window.dispatchEvent(new MouseEvent('pointerup'));
    await page.waitForChanges();
    expect(bottomRightEl?.getAttribute('x')).toBe('102');
    expect(bottomRightEl?.getAttribute('y')).toBe('102');

    topRightEl?.dispatchEvent(new MouseEvent('pointerdown'));
    window.dispatchEvent(
      new MouseEvent('pointermove', {
        clientX: 90,
        clientY: 10,
      })
    );
    window.dispatchEvent(new MouseEvent('pointerup'));
    await page.waitForChanges();
    expect(topRightEl?.getAttribute('x')).toBe('92');
    expect(topRightEl?.getAttribute('y')).toBe('0');

    leftEl?.dispatchEvent(new MouseEvent('pointerdown'));
    window.dispatchEvent(
      new MouseEvent('pointermove', {
        clientX: 50,
        clientY: 50,
      })
    );
    window.dispatchEvent(new MouseEvent('pointerup'));
    await page.waitForChanges();
    expect(leftEl?.getAttribute('x')).toBe('40');
    expect(leftEl?.getAttribute('y')).toBe('51');

    topLeftEl?.dispatchEvent(new MouseEvent('pointerdown'));
    window.dispatchEvent(
      new MouseEvent('pointermove', {
        clientX: 60,
        clientY: 20,
      })
    );
    window.dispatchEvent(new MouseEvent('pointerup'));
    await page.waitForChanges();
    expect(topLeftEl?.getAttribute('x')).toBe('50');
    expect(topLeftEl?.getAttribute('y')).toBe('10');

    bottomLeftEl?.dispatchEvent(new MouseEvent('pointerdown'));
    window.dispatchEvent(
      new MouseEvent('pointermove', {
        clientX: 40,
        clientY: 90,
      })
    );
    window.dispatchEvent(new MouseEvent('pointerup'));
    await page.waitForChanges();
    expect(bottomLeftEl?.getAttribute('x')).toBe('30');
    expect(bottomLeftEl?.getAttribute('y')).toBe('92');

    topEl?.dispatchEvent(new MouseEvent('pointerdown'));
    window.dispatchEvent(
      new MouseEvent('pointermove', {
        clientX: 50,
        clientY: 30,
      })
    );
    window.dispatchEvent(new MouseEvent('pointerup'));
    await page.waitForChanges();
    expect(topEl?.getAttribute('x')).toBe('61');
    expect(topEl?.getAttribute('y')).toBe('20');

    bottomEl?.dispatchEvent(new MouseEvent('pointerdown'));
    window.dispatchEvent(
      new MouseEvent('pointermove', {
        clientX: 50,
        clientY: 80,
      })
    );
    window.dispatchEvent(new MouseEvent('pointerup'));
    await page.waitForChanges();
    expect(bottomEl?.getAttribute('x')).toBe('61');
    expect(bottomEl?.getAttribute('y')).toBe('82');

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
    expect(centerEl?.getAttribute('cx')).toBe('50');
    expect(centerEl?.getAttribute('cy')).toBe('50');

    expect(rightEl?.getAttribute('x')).toBe('77');
    expect(rightEl?.getAttribute('y')).toBe('46');
    expect(bottomRightEl?.getAttribute('x')).toBe('77');
    expect(bottomRightEl?.getAttribute('y')).toBe('77');
    expect(topRightEl?.getAttribute('x')).toBe('77');
    expect(topRightEl?.getAttribute('y')).toBe('15');
    expect(leftEl?.getAttribute('x')).toBe('15');
    expect(leftEl?.getAttribute('y')).toBe('46');
    expect(topLeftEl?.getAttribute('x')).toBe('15');
    expect(topLeftEl?.getAttribute('y')).toBe('15');
    expect(bottomLeftEl?.getAttribute('x')).toBe('15');
    expect(bottomLeftEl?.getAttribute('y')).toBe('77');
    expect(topEl?.getAttribute('x')).toBe('46');
    expect(topEl?.getAttribute('y')).toBe('15');
    expect(bottomEl?.getAttribute('x')).toBe('46');
    expect(bottomEl?.getAttribute('y')).toBe('77');
  });

  it('should support maintaining aspect ratio', async () => {
    const page = await newSpecPage({
      components: [ViewerMarkupCircle],
      template: () => (
        <vertex-viewer-markup-circle
          bounds={bounds}
          mode="edit"
        ></vertex-viewer-markup-circle>
      ),
    });

    const el = page.root as HTMLVertexViewerMarkupCircleElement;
    const bottomRightEl = el?.shadowRoot?.getElementById(
      'bounding-box-2d-bottom-right-anchor'
    );

    bottomRightEl?.dispatchEvent(new MouseEvent('pointerdown'));
    window.dispatchEvent(
      new MouseEvent('pointermove', {
        clientX: 50,
        clientY: 100,
        shiftKey: true,
      })
    );
    window.dispatchEvent(new MouseEvent('pointerup'));
    await page.waitForChanges();
    expect(bottomRightEl?.getAttribute('x')).toBe('102');
    expect(bottomRightEl?.getAttribute('y')).toBe('102');
  });

  it('should cancel markup editing if no movement occurs', async () => {
    const onEditCancel = jest.fn();
    await newSpecPage({
      components: [ViewerMarkupCircle],
      template: () => (
        <vertex-viewer-markup-circle
          mode="replace"
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          viewer={viewer as any}
          onEditCancel={onEditCancel}
        ></vertex-viewer-markup-circle>
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
      components: [ViewerMarkupCircle],
      template: () => (
        <vertex-viewer-markup-circle
          mode="replace"
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          viewer={viewer as any}
        ></vertex-viewer-markup-circle>
      ),
    });

    const el = page.root as HTMLVertexViewerMarkupCircleElement;
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
      components: [ViewerMarkupCircle],
      template: () => (
        <vertex-viewer-markup-circle
          mode="replace"
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          viewer={viewer as any}
        ></vertex-viewer-markup-circle>
      ),
    });

    const el = page.root as HTMLVertexViewerMarkupCircleElement;
    el.dispose();
    await page.waitForChanges();

    expect(removeEventListener).toHaveBeenCalledWith(
      'pointerdown',
      expect.anything()
    );
  });
});
