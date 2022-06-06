jest.mock('../viewer/utils');
jest.mock('../viewer-markup/dom');

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';
import { Point } from '@vertexvis/geometry';

import { Viewer } from '../viewer/viewer';
import { getMarkupBoundingClientRect } from '../viewer-markup/dom';
import { ViewerMarkup } from '../viewer-markup/viewer-markup';
import { ViewerMarkupArrow } from './viewer-markup-arrow';

describe('vertex-viewer-markup-arrow', () => {
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
    jest.clearAllMocks();
  });

  it('positions the anchors correctly', async () => {
    const page = await newSpecPage({
      components: [ViewerMarkupArrow],
      template: () => (
        <vertex-viewer-markup-arrow start={start} end={end} mode="edit" />
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

    expect(startEl?.getAttribute('style')).toContain('left: 50px');
    expect(startEl?.getAttribute('style')).toContain('top: 0px');
    expect(endEl?.getAttribute('style')).toContain('left: 50px');
    expect(endEl?.getAttribute('style')).toContain('top: 50px');
    expect(centerEl?.getAttribute('style')).toContain('left: 50px');
    expect(centerEl?.getAttribute('style')).toContain('top: 25px');
  });

  it('handles resizes', async () => {
    const page = await newSpecPage({
      components: [Viewer, ViewerMarkup, ViewerMarkupArrow],
      template: () => (
        <vertex-viewer>
          <vertex-viewer-markup>
            <vertex-viewer-markup-arrow start={start} end={end} mode="edit" />
          </vertex-viewer-markup>
        </vertex-viewer>
      ),
    });

    const el = page.root?.querySelector(
      'vertex-viewer-markup-arrow'
    ) as HTMLVertexViewerMarkupArrowElement;
    const startEl = el?.shadowRoot?.getElementById(
      'bounding-box-1d-start-anchor'
    );
    const endEl = el?.shadowRoot?.getElementById('bounding-box-1d-end-anchor');
    const centerEl = el?.shadowRoot?.getElementById(
      'bounding-box-1d-center-anchor'
    );

    startEl?.dispatchEvent(new MouseEvent('pointerdown'));
    window.dispatchEvent(
      new MouseEvent('pointermove', { clientX: 100, clientY: 0 })
    );
    window.dispatchEvent(new MouseEvent('pointerup'));
    await page.waitForChanges();
    expect(startEl?.getAttribute('style')).toContain('left: 100px');
    expect(startEl?.getAttribute('style')).toContain('top: 0px');

    endEl?.dispatchEvent(new MouseEvent('pointerdown'));
    window.dispatchEvent(
      new MouseEvent('pointermove', { clientX: 100, clientY: 50 })
    );
    window.dispatchEvent(new MouseEvent('pointerup'));
    await page.waitForChanges();
    expect(endEl?.getAttribute('style')).toContain('left: 100px');
    expect(endEl?.getAttribute('style')).toContain('top: 50px');

    centerEl?.dispatchEvent(new MouseEvent('pointerdown'));
    window.dispatchEvent(
      new MouseEvent('pointermove', { clientX: 50, clientY: 50 })
    );
    window.dispatchEvent(new MouseEvent('pointerup'));
    await page.waitForChanges();
    expect(startEl?.getAttribute('style')).toContain('left: 50px');
    expect(startEl?.getAttribute('style')).toContain('top: 25px');
    expect(endEl?.getAttribute('style')).toContain('left: 50px');
    expect(endEl?.getAttribute('style')).toContain('top: 75px');
    expect(centerEl?.getAttribute('style')).toContain('left: 50px');
    expect(centerEl?.getAttribute('style')).toContain('top: 50px');
  });

  it('removes event listeners when the viewer changes', async () => {
    const page = await newSpecPage({
      components: [Viewer, ViewerMarkup, ViewerMarkupArrow],
      template: () => (
        <vertex-viewer>
          <vertex-viewer-markup>
            <vertex-viewer-markup-arrow mode="create" />
          </vertex-viewer-markup>
        </vertex-viewer>
      ),
    });

    const root = page.root as HTMLVertexViewerElement;
    const newViewer = page.doc.createElement('vertex-viewer');

    const canvas = root.shadowRoot?.querySelector(
      'canvas'
    ) as HTMLCanvasElement;
    const removeEventListener = jest.spyOn(canvas, 'removeEventListener');

    const markup = root.querySelector(
      'vertex-viewer-markup-arrow'
    ) as HTMLVertexViewerMarkupArrowElement;
    markup.viewer = newViewer;
    await page.waitForChanges();

    expect(removeEventListener).toHaveBeenCalledWith(
      'pointerdown',
      expect.anything()
    );
  });

  it('removes event listeners when disposed', async () => {
    const page = await newSpecPage({
      components: [Viewer, ViewerMarkup, ViewerMarkupArrow],
      template: () => (
        <vertex-viewer>
          <vertex-viewer-markup>
            <vertex-viewer-markup-arrow mode="create" />
          </vertex-viewer-markup>
        </vertex-viewer>
      ),
    });

    const root = page.root as HTMLVertexViewerElement;

    const canvas = root.shadowRoot?.querySelector(
      'canvas'
    ) as HTMLCanvasElement;
    const removeEventListener = jest.spyOn(canvas, 'removeEventListener');

    const el = root.querySelector(
      'vertex-viewer-markup-arrow'
    ) as HTMLVertexViewerMarkupArrowElement;
    el.dispose();
    await page.waitForChanges();

    expect(removeEventListener).toHaveBeenCalledWith(
      'pointerdown',
      expect.anything()
    );
  });
});
