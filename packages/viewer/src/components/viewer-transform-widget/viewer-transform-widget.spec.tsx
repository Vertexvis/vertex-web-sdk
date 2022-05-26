jest.mock('../viewer/utils');
jest.mock('../../lib/rendering/imageLoaders');
jest.mock('./widget');
jest.mock('../../lib/stencil', () => ({
  readDOM: jest.fn((callback) => callback()),
}));
jest.mock('./util', () => ({
  convertPointToCanvas: jest.fn(),
  convertCanvasPointToWorld: jest.fn(),
  computeUpdatedTransform: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';
import { Matrix4, Point, Vector3 } from '@vertexvis/geometry';

import { loadImageBytes } from '../../lib/rendering/imageLoaders';
import { TriangleMesh, TriangleMeshPoints } from '../../lib/transforms/mesh';
import { makePerspectiveFrame } from '../../testing/fixtures';
import {
  key1,
  loadViewerStreamKey,
  makeViewerStream,
} from '../../testing/viewer';
import { getElementBoundingClientRect } from '../viewer/utils';
import { Viewer } from '../viewer/viewer';
import {
  computeUpdatedTransform,
  convertCanvasPointToWorld,
  convertPointToCanvas,
} from './util';
import { ViewerTransformWidget } from './viewer-transform-widget';
import { TransformWidget } from './widget';

describe('vertex-viewer-transform-widget', () => {
  const mockTransformWidget = new TransformWidget(
    document.createElement('canvas')
  );

  (loadImageBytes as jest.Mock).mockReturnValue({
    width: 200,
    height: 150,
    dispose: () => undefined,
  });
  (getElementBoundingClientRect as jest.Mock).mockReturnValue({
    left: 0,
    top: 0,
    bottom: 150,
    right: 200,
    width: 200,
    height: 150,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders a canvas', async () => {
    const page = await newSpecPage({
      components: [ViewerTransformWidget],
      html: `<vertex-viewer-transform-widget></vertex-viewer-transform-widget>`,
    });

    expect(page.root?.shadowRoot?.querySelector('canvas')).toBeDefined();
  });

  it('renders a widget at the provided position', async () => {
    const { stream, ws } = makeViewerStream();
    const page = await newSpecPage({
      components: [Viewer, ViewerTransformWidget],
      template: () => (
        <vertex-viewer stream={stream}>
          <vertex-viewer-transform-widget></vertex-viewer-transform-widget>
        </vertex-viewer>
      ),
    });

    const viewer = page.body.querySelector(
      'vertex-viewer'
    ) as HTMLVertexViewerElement;
    const widget = page.body.querySelector(
      'vertex-viewer-transform-widget'
    ) as HTMLVertexViewerTransformWidgetElement;

    await loadViewerStreamKey(key1, { viewer, stream, ws });
    await page.waitForChanges();
    await page.waitForChanges();

    const frame = makePerspectiveFrame();
    viewer.dispatchFrameDrawn(frame);

    widget.position = Vector3.create(1, 1, 1);

    await page.waitForChanges();

    expect(mockTransformWidget.updateTransform).toHaveBeenCalledWith(
      Matrix4.makeTranslation(widget.position)
    );
    expect(mockTransformWidget.updateFrame).toHaveBeenCalledWith(frame, true);
  });

  it('provides the cursor position to the internal widget if within the widget bounds', async () => {
    const { stream, ws } = makeViewerStream();
    const page = await newSpecPage({
      components: [Viewer, ViewerTransformWidget],
      template: () => (
        <vertex-viewer stream={stream}>
          <vertex-viewer-transform-widget></vertex-viewer-transform-widget>
        </vertex-viewer>
      ),
    });

    const viewer = page.body.querySelector(
      'vertex-viewer'
    ) as HTMLVertexViewerElement;
    const widget = page.body.querySelector(
      'vertex-viewer-transform-widget'
    ) as HTMLVertexViewerTransformWidgetElement;

    await loadViewerStreamKey(key1, { viewer, stream, ws });
    await page.waitForChanges();
    await page.waitForChanges();

    const frame = makePerspectiveFrame();
    viewer.dispatchFrameDrawn(frame);

    widget.position = Vector3.create(1, 1, 1);

    await page.waitForChanges();

    (mockTransformWidget.boundsContainsPoint as jest.Mock).mockImplementation(
      () => true
    );
    (convertPointToCanvas as jest.Mock).mockImplementation(() =>
      Point.create(0, 0)
    );

    window.dispatchEvent(new MouseEvent('pointermove'));

    expect(mockTransformWidget.updateCursor).toHaveBeenCalledWith(
      Point.create(0, 0)
    );

    (mockTransformWidget.boundsContainsPoint as jest.Mock).mockImplementation(
      () => false
    );
    window.dispatchEvent(new MouseEvent('pointermove'));

    expect(mockTransformWidget.updateCursor).toHaveBeenCalledWith(undefined);
  });

  it('performs a transform', async () => {
    const { stream, ws } = makeViewerStream();
    const page = await newSpecPage({
      components: [Viewer, ViewerTransformWidget],
      template: () => (
        <vertex-viewer stream={stream}>
          <vertex-viewer-transform-widget></vertex-viewer-transform-widget>
        </vertex-viewer>
      ),
    });

    const viewer = page.body.querySelector(
      'vertex-viewer'
    ) as HTMLVertexViewerElement;
    const widget = page.body.querySelector(
      'vertex-viewer-transform-widget'
    ) as HTMLVertexViewerTransformWidgetElement;

    await loadViewerStreamKey(key1, { viewer, stream, ws });
    await page.waitForChanges();
    await page.waitForChanges();

    const onInteractionEnded = jest.fn();
    const onInteractionStarted = jest.fn();

    const frame = makePerspectiveFrame();
    viewer.dispatchFrameDrawn(frame);

    widget.position = Vector3.create(1, 1, 1);
    widget.addEventListener('interactionEnded', onInteractionEnded);
    widget.addEventListener('interactionStarted', onInteractionStarted);

    await page.waitForChanges();

    widget.hovered = new TriangleMesh(
      jest.fn(),
      'x-translate',
      new TriangleMeshPoints(
        true,
        Vector3.create(),
        Vector3.create(),
        Vector3.create(),
        Vector3.create(),
        Point.create(),
        Point.create(),
        Point.create(),
        Point.create()
      ),
      '#000000',
      '#000000'
    );
    const beginSpy = jest.spyOn(stream, 'beginInteraction');
    const updateSpy = jest.spyOn(stream, 'updateInteraction');
    const endSpy = jest
      .spyOn(stream, 'endInteraction')
      .mockReturnValue(Promise.resolve({}));

    (convertCanvasPointToWorld as jest.Mock).mockImplementation(() =>
      Vector3.create(1, 1, 1)
    );
    (computeUpdatedTransform as jest.Mock).mockImplementation(() =>
      Matrix4.makeTranslation(Vector3.create(2, 2, 2))
    );

    widget.shadowRoot
      ?.querySelector('canvas')
      ?.dispatchEvent(new MouseEvent('pointerdown'));

    window.dispatchEvent(new MouseEvent('pointermove'));

    expect(beginSpy).toHaveBeenCalled();
    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        transform: {
          delta: {
            basisX: Vector3.create(1, 0, 0),
            basisY: Vector3.create(0, 1, 0),
            basisZ: Vector3.create(0, 0, 1),
            xlate: Vector3.create(1, 1, 1),
            scale: 1,
          },
        },
      })
    );

    window.dispatchEvent(new MouseEvent('pointerup'));

    expect(endSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        transform: {
          delta: {
            basisX: Vector3.create(1, 0, 0),
            basisY: Vector3.create(0, 1, 0),
            basisZ: Vector3.create(0, 0, 1),
            xlate: Vector3.create(1, 1, 1),
            scale: 1,
          },
        },
      })
    );

    await page.waitForChanges();
    expect(onInteractionEnded).toHaveBeenCalled();
    expect(onInteractionStarted).toHaveBeenCalled();
  });

  it('updates widget bounds when the viewer dimensions change', async () => {
    const { stream, ws } = makeViewerStream();
    const page = await newSpecPage({
      components: [Viewer, ViewerTransformWidget],
      template: () => (
        <vertex-viewer stream={stream}>
          <vertex-viewer-transform-widget></vertex-viewer-transform-widget>
        </vertex-viewer>
      ),
    });

    const viewer = page.body.querySelector(
      'vertex-viewer'
    ) as HTMLVertexViewerElement;
    const widget = page.body.querySelector(
      'vertex-viewer-transform-widget'
    ) as HTMLVertexViewerTransformWidgetElement;
    const canvas = widget.shadowRoot?.querySelector(
      'canvas'
    ) as HTMLCanvasElement;

    await loadViewerStreamKey(key1, { viewer, stream, ws });
    await page.waitForChanges();
    await page.waitForChanges();

    const frame = makePerspectiveFrame();
    viewer.dispatchFrameDrawn(frame);

    widget.position = Vector3.create(1, 1, 1);

    await page.waitForChanges();

    canvas.width = 5000;
    canvas.height = 5000;

    viewer.dispatchEvent(new CustomEvent('dimensionschange'));

    await page.waitForChanges();

    expect(mockTransformWidget.updateDimensions).toHaveBeenCalledWith(
      expect.objectContaining({
        width: 5000,
        height: 5000,
      })
    );
  });

  it('ends any interaction and clears the widget position if the component position is cleared', async () => {
    const { stream, ws } = makeViewerStream();
    const page = await newSpecPage({
      components: [Viewer, ViewerTransformWidget],
      template: () => (
        <vertex-viewer stream={stream}>
          <vertex-viewer-transform-widget></vertex-viewer-transform-widget>
        </vertex-viewer>
      ),
    });

    const viewer = page.body.querySelector(
      'vertex-viewer'
    ) as HTMLVertexViewerElement;
    const widget = page.body.querySelector(
      'vertex-viewer-transform-widget'
    ) as HTMLVertexViewerTransformWidgetElement;

    await loadViewerStreamKey(key1, { viewer, stream, ws });
    await page.waitForChanges();
    await page.waitForChanges();

    const frame = makePerspectiveFrame();
    viewer.dispatchFrameDrawn(frame);

    widget.position = Vector3.create(1, 1, 1);

    await page.waitForChanges();

    widget.hovered = new TriangleMesh(
      jest.fn(),
      'x-translate',
      new TriangleMeshPoints(
        true,
        Vector3.create(),
        Vector3.create(),
        Vector3.create(),
        Vector3.create(),
        Point.create(),
        Point.create(),
        Point.create(),
        Point.create()
      ),
      '#000000',
      '#000000'
    );

    const endSpy = jest.spyOn(stream, 'endInteraction');

    (convertCanvasPointToWorld as jest.Mock).mockImplementation(() =>
      Vector3.create(1, 1, 1)
    );
    (computeUpdatedTransform as jest.Mock).mockImplementation(() =>
      Vector3.create(2, 2, 2)
    );

    widget.shadowRoot
      ?.querySelector('canvas')
      ?.dispatchEvent(new MouseEvent('pointerdown'));

    (mockTransformWidget.updateTransform as jest.Mock).mockClear();
    widget.position = undefined;

    await page.waitForChanges();

    expect(endSpy).toHaveBeenCalled();
    expect(mockTransformWidget.updateTransform).toHaveBeenCalledWith(undefined);
  });

  it('should dispatch an event when the position of the widget changes', async () => {
    const { stream, ws } = makeViewerStream();

    const page = await newSpecPage({
      components: [Viewer, ViewerTransformWidget],
      template: () => (
        <vertex-viewer stream={stream}>
          <vertex-viewer-transform-widget></vertex-viewer-transform-widget>
        </vertex-viewer>
      ),
    });

    const viewer = page.body.querySelector(
      'vertex-viewer'
    ) as HTMLVertexViewerElement;
    const widget = page.body.querySelector(
      'vertex-viewer-transform-widget'
    ) as HTMLVertexViewerTransformWidgetElement;

    await loadViewerStreamKey(key1, { viewer, stream, ws });

    const onPositionChanged = jest.fn();
    widget.addEventListener('positionChanged', onPositionChanged);

    const position1 = Vector3.create(1, 1, 1);
    widget.position = position1;

    await page.waitForChanges();

    const position2 = Vector3.create(2, 2, 2);
    widget.position = position2;

    await page.waitForChanges();

    expect(onPositionChanged).toHaveBeenCalledTimes(2);
    expect(onPositionChanged).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: position1,
      })
    );
    expect(onPositionChanged).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: position2,
      })
    );
  });
});
