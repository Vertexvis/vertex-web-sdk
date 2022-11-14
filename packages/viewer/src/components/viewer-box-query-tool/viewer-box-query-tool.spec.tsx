jest.mock('../../lib/rendering/imageLoaders');
jest.mock('../../workers/png-decoder-pool');

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h } from '@stencil/core';
import { newSpecPage, SpecPage } from '@stencil/core/testing';
import { Async } from '@vertexvis/utils';

import {
  key1,
  loadViewerStreamKey,
  makeViewerStream,
} from '../../testing/viewer';
import { Viewer } from '../viewer/viewer';
import { ViewerLayer } from '../viewer-layer/viewer-layer';
import { ViewerBoxQueryTool } from './viewer-box-query-tool';

describe('vertex-viewer-box-query-tool', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders a vertex-viewer-layer', async () => {
    const page = await newSpecPage({
      components: [ViewerBoxQueryTool, ViewerLayer],
      html: `<vertex-viewer-box-query-tool></vertex-viewer-box-query-tool>`,
    });
    expect(page.root).toEqualHtml(`
      <vertex-viewer-box-query-tool>
        <mock:shadow-root>
          <vertex-viewer-layer>
            <mock:shadow-root>
              <slot></slot>
            </mock:shadow-root>
          </vertex-viewer-layer>
        </mock:shadow-root>
      </vertex-viewer-box-query-tool>
    `);
  });

  it('renders a default box to represent the query', async () => {
    const { stream, ws } = makeViewerStream();

    const page = await newSpecPage({
      components: [Viewer, ViewerBoxQueryTool, ViewerLayer],
      template: () => (
        <vertex-viewer stream={stream}>
          <vertex-viewer-box-query-tool></vertex-viewer-box-query-tool>
        </vertex-viewer>
      ),
    });

    const viewer = page.root as HTMLVertexViewerElement;

    await loadViewerStreamKey(key1, { viewer, stream, ws });
    await drawExclusiveBox(page, viewer);

    const pointerUpEvent = new MouseEvent('pointerup');

    const tool = viewer.querySelector('vertex-viewer-box-query-tool');
    const layer = tool?.shadowRoot?.querySelector('vertex-viewer-layer');

    let bounds = layer?.querySelector('div.bounds');

    expect(bounds).not.toBeNull();

    expect(bounds?.getAttribute('style')).toMatch(
      'left: 5px; top: 5px; width: 10px; height: 10px;'
    );

    window.dispatchEvent(pointerUpEvent);
    await page.waitForChanges();

    bounds = layer?.querySelector('div.bounds');

    expect(bounds).toBeNull();
  });

  it('sends a selection query for the frustum using exclusive', async () => {
    const { stream, ws } = makeViewerStream();

    const page = await newSpecPage({
      components: [Viewer, ViewerBoxQueryTool, ViewerLayer],
      template: () => (
        <vertex-viewer stream={stream}>
          <vertex-viewer-box-query-tool></vertex-viewer-box-query-tool>
        </vertex-viewer>
      ),
    });

    const viewer = page.root as HTMLVertexViewerElement;

    const streamSpy = jest.spyOn(stream, 'createSceneAlteration');

    await loadViewerStreamKey(key1, { viewer, stream, ws });
    await drawExclusiveBox(page, viewer);

    const pointerUpEvent = new MouseEvent('pointerup');

    window.dispatchEvent(pointerUpEvent);
    await page.waitForChanges();

    expect(streamSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        operations: expect.arrayContaining([
          expect.objectContaining({
            volume: {
              exclusive: true,
              frustumByRectangle: {
                rectangle: { height: 10, width: 10, x: 5, y: 5 },
              },
              viewport: { center: { x: 0, y: 0 }, height: 0, width: 0 },
            },
            operationTypes: expect.arrayContaining([
              {
                changeSelection: expect.objectContaining({
                  material: expect.any(Object),
                }),
              },
            ]),
          }),
        ]),
      })
    );
  });

  it('sends a selection query for the frustum using inclusive', async () => {
    const { stream, ws } = makeViewerStream();

    const page = await newSpecPage({
      components: [Viewer, ViewerBoxQueryTool, ViewerLayer],
      template: () => (
        <vertex-viewer stream={stream}>
          <vertex-viewer-box-query-tool></vertex-viewer-box-query-tool>
        </vertex-viewer>
      ),
    });

    const viewer = page.root as HTMLVertexViewerElement;

    const streamSpy = jest.spyOn(stream, 'createSceneAlteration');

    await loadViewerStreamKey(key1, { viewer, stream, ws });
    await drawInclusiveBox(page, viewer);

    const pointerUpEvent = new MouseEvent('pointerup');

    window.dispatchEvent(pointerUpEvent);
    await page.waitForChanges();

    expect(streamSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        operations: expect.arrayContaining([
          expect.objectContaining({
            volume: {
              exclusive: false,
              frustumByRectangle: {
                rectangle: { height: 10, width: 10, x: 5, y: 5 },
              },
              viewport: { center: { x: 0, y: 0 }, height: 0, width: 0 },
            },
            operationTypes: expect.arrayContaining([
              {
                changeSelection: expect.objectContaining({
                  material: expect.any(Object),
                }),
              },
            ]),
          }),
        ]),
      })
    );
  });

  it('sends a deselection query for the frustum using the deselect default operation', async () => {
    const { stream, ws } = makeViewerStream();

    const page = await newSpecPage({
      components: [Viewer, ViewerBoxQueryTool, ViewerLayer],
      template: () => (
        <vertex-viewer stream={stream}>
          <vertex-viewer-box-query-tool operationType="deselect"></vertex-viewer-box-query-tool>
        </vertex-viewer>
      ),
    });

    const viewer = page.root as HTMLVertexViewerElement;

    const streamSpy = jest.spyOn(stream, 'createSceneAlteration');

    await loadViewerStreamKey(key1, { viewer, stream, ws });
    await drawInclusiveBox(page, viewer);

    const pointerUpEvent = new MouseEvent('pointerup');

    window.dispatchEvent(pointerUpEvent);
    await page.waitForChanges();

    expect(streamSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        operations: expect.arrayContaining([
          expect.objectContaining({
            volume: {
              exclusive: false,
              frustumByRectangle: {
                rectangle: { height: 10, width: 10, x: 5, y: 5 },
              },
              viewport: { center: { x: 0, y: 0 }, height: 0, width: 0 },
            },
            operationTypes: expect.arrayContaining([
              {
                changeSelection: {},
              },
            ]),
          }),
        ]),
      })
    );
  });

  it('disables the interaction handler while an operation is being executed', async () => {
    const { stream, ws } = makeViewerStream();

    const page = await newSpecPage({
      components: [Viewer, ViewerBoxQueryTool, ViewerLayer],
      template: () => (
        <vertex-viewer stream={stream}>
          <vertex-viewer-box-query-tool></vertex-viewer-box-query-tool>
        </vertex-viewer>
      ),
    });

    const viewer = page.root as HTMLVertexViewerElement;

    await loadViewerStreamKey(key1, { viewer, stream, ws });

    const streamSpy = jest
      .spyOn(stream, 'createSceneAlteration')
      .mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return {};
      });

    await drawInclusiveBox(page, viewer);
    window.dispatchEvent(new MouseEvent('pointerup'));

    await drawExclusiveBox(page, viewer);
    window.dispatchEvent(new MouseEvent('pointerup'));

    await page.waitForChanges();
    await Async.delay(10);

    await drawExclusiveBox(page, viewer);
    window.dispatchEvent(new MouseEvent('pointerup'));

    await page.waitForChanges();
\
    expect(streamSpy).toHaveBeenCalledTimes(2);
    expect(streamSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        operations: expect.arrayContaining([
          expect.objectContaining({
            volume: {
              exclusive: false,
              frustumByRectangle: {
                rectangle: { height: 10, width: 10, x: 5, y: 5 },
              },
              viewport: { center: { x: 0, y: 0 }, height: 0, width: 0 },
            },
            operationTypes: expect.arrayContaining([
              {
                changeSelection: expect.objectContaining({
                  material: expect.any(Object),
                }),
              },
            ]),
          }),
        ]),
      })
    );
    expect(streamSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        operations: expect.arrayContaining([
          expect.objectContaining({
            volume: {
              exclusive: true,
              frustumByRectangle: {
                rectangle: { height: 10, width: 10, x: 5, y: 5 },
              },
              viewport: { center: { x: 0, y: 0 }, height: 0, width: 0 },
            },
            operationTypes: expect.arrayContaining([
              {
                changeSelection: expect.objectContaining({
                  material: expect.any(Object),
                }),
              },
            ]),
          }),
        ]),
      })
    );
  });
});

async function drawExclusiveBox(
  page: SpecPage,
  viewer: HTMLVertexViewerElement
): Promise<void> {
  const canvas = viewer.shadowRoot?.querySelector('canvas');

  const pointerDownEvent = new MouseEvent('pointerdown', {
    buttons: 1,
    clientX: 5,
    clientY: 5,
  });
  const pointerMoveEvent = new MouseEvent('pointermove', {
    clientX: 15,
    clientY: 15,
  });

  canvas?.dispatchEvent(pointerDownEvent);
  await page.waitForChanges();
  window.dispatchEvent(pointerMoveEvent);
  await page.waitForChanges();
}

async function drawInclusiveBox(
  page: SpecPage,
  viewer: HTMLVertexViewerElement
): Promise<void> {
  const canvas = viewer.shadowRoot?.querySelector('canvas');

  const pointerDownEvent = new MouseEvent('pointerdown', {
    buttons: 1,
    clientX: 15,
    clientY: 15,
  });
  const pointerMoveEvent = new MouseEvent('pointermove', {
    clientX: 5,
    clientY: 5,
  });

  canvas?.dispatchEvent(pointerDownEvent);
  await page.waitForChanges();
  window.dispatchEvent(pointerMoveEvent);
  await page.waitForChanges();
}
