jest.mock('../viewer/utils');
jest.mock('../viewer-markup/dom');

import '../../testing/domMocks';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';
import { Point } from '@vertexvis/geometry';
import { ViewerMarkupArrow } from './viewer-markup-arrow';
import { getMarkupBoundingClientRect } from '../viewer-markup/dom';

describe('vertex-viewer-markup-arrow', () => {
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
  const start = Point.create(0, -0.5);
  const end = Point.create(0, 0);
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
      components: [ViewerMarkupArrow],
      template: () => (
        <vertex-viewer-markup-arrow
          start={start}
          end={end}
          mode="edit"
        ></vertex-viewer-markup-arrow>
      ),
    });

    const el = page.root as HTMLVertexViewerMarkupArrowElement;
    const startEl = el?.shadowRoot?.getElementById(
      'bounding-box-1d-start-anchor'
    );
    const endEl = el?.shadowRoot?.getElementById('bounding-box-1d-end-anchor');
    const centerEl = el?.shadowRoot?.getElementById(
      'bounding-box-1d-center-anchor'
    );

    expect(startEl?.getAttribute('x')).toBe('46');
    expect(startEl?.getAttribute('y')).toBe('-4');
    expect(endEl?.getAttribute('x')).toBe('46');
    expect(endEl?.getAttribute('y')).toBe('46');
    expect(centerEl?.getAttribute('cx')).toBe('50');
    expect(centerEl?.getAttribute('cy')).toBe('25');
  });

  it('handles resizes', async () => {
    const page = await newSpecPage({
      components: [ViewerMarkupArrow],
      template: () => (
        <vertex-viewer-markup-arrow
          start={start}
          end={end}
          mode="edit"
        ></vertex-viewer-markup-arrow>
      ),
    });

    const el = page.root as HTMLVertexViewerMarkupArrowElement;
    const startEl = el?.shadowRoot?.getElementById(
      'bounding-box-1d-start-anchor'
    );
    const endEl = el?.shadowRoot?.getElementById('bounding-box-1d-end-anchor');
    const centerEl = el?.shadowRoot?.getElementById(
      'bounding-box-1d-center-anchor'
    );

    startEl?.dispatchEvent(new MouseEvent('pointerdown'));
    window.dispatchEvent(
      new MouseEvent('pointermove', {
        clientX: 100,
        clientY: 0,
      })
    );
    window.dispatchEvent(new MouseEvent('pointerup'));
    await page.waitForChanges();
    expect(startEl?.getAttribute('x')).toBe('96');
    expect(startEl?.getAttribute('y')).toBe('-4');

    endEl?.dispatchEvent(new MouseEvent('pointerdown'));
    window.dispatchEvent(
      new MouseEvent('pointermove', {
        clientX: 100,
        clientY: 50,
      })
    );
    window.dispatchEvent(new MouseEvent('pointerup'));
    await page.waitForChanges();
    expect(endEl?.getAttribute('x')).toBe('96');
    expect(endEl?.getAttribute('y')).toBe('46');

    centerEl?.dispatchEvent(new MouseEvent('pointerdown'));
    window.dispatchEvent(
      new MouseEvent('pointermove', {
        clientX: 50,
        clientY: 50,
      })
    );
    window.dispatchEvent(new MouseEvent('pointerup'));
    await page.waitForChanges();
    expect(startEl?.getAttribute('x')).toBe('46');
    expect(startEl?.getAttribute('y')).toBe('21');
    expect(endEl?.getAttribute('x')).toBe('46');
    expect(endEl?.getAttribute('y')).toBe('71');
    expect(centerEl?.getAttribute('cx')).toBe('50');
    expect(centerEl?.getAttribute('cy')).toBe('50');
  });

  it('should cancel markup editing if no movement occurs', async () => {
    const onEditCancel = jest.fn();
    await newSpecPage({
      components: [ViewerMarkupArrow],
      template: () => (
        <vertex-viewer-markup-arrow
          mode="replace"
          viewer={viewer as any}
          onEditCancel={onEditCancel}
        ></vertex-viewer-markup-arrow>
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
      components: [ViewerMarkupArrow],
      template: () => (
        <vertex-viewer-markup-arrow
          mode="replace"
          viewer={viewer as any}
        ></vertex-viewer-markup-arrow>
      ),
    });

    const el = page.root as HTMLVertexViewerMarkupArrowElement;
    el.viewer = newViewer as any;
    await page.waitForChanges();

    expect(removeEventListener).toHaveBeenCalledWith(
      'pointerdown',
      expect.anything()
    );
  });

  it('removes event listeners when disposed', async () => {
    const page = await newSpecPage({
      components: [ViewerMarkupArrow],
      template: () => (
        <vertex-viewer-markup-arrow
          mode="replace"
          viewer={viewer as any}
        ></vertex-viewer-markup-arrow>
      ),
    });

    const el = page.root as HTMLVertexViewerMarkupArrowElement;
    el.dispose();
    await page.waitForChanges();

    expect(removeEventListener).toHaveBeenCalledWith(
      'pointerdown',
      expect.anything()
    );
  });
});
