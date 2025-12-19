jest.mock('../viewer/utils');
jest.mock('../../lib/rendering/imageLoaders');
jest.mock('./widget');
jest.mock('../../lib/stencil', () => ({
  readDOM: jest.fn((callback) => callback()),
  writeDOM: jest.fn((callback) => callback()),
}));
jest.mock('./util', () => {
  const actual = jest.requireActual('./util');

  return {
    ...actual,
    convertPointToCanvas: jest.fn(),
    convertCanvasPointToWorld: jest.fn(),
    computeHandleDeltaTransform: jest.fn(),
  };
});
jest.mock('./dom');

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';
import {
  Angle,
  Euler,
  Matrix4,
  Point,
  Rectangle,
  Vector3,
} from '@vertexvis/geometry';
import { Async } from '@vertexvis/utils';

import { Viewport } from '../..';
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
  computeHandleDeltaTransform,
  convertCanvasPointToWorld,
  convertPointToCanvas,
} from './util';
import { ViewerTransformWidget } from './viewer-transform-widget';
import { TransformWidget } from './widget';

function dispatchKeydownEvent(
  target: Element,
  key: string,
  count: number
): void {
  for (let i = 0; i < count; i++) {
    target.dispatchEvent(new KeyboardEvent('keydown', { key }));
  }
}

describe('vertex-viewer-transform-widget', () => {
  const mockTransformWidget = new TransformWidget(
    document.createElement('canvas')
  );

  (loadImageBytes as jest.Mock).mockResolvedValue({
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
    const beginSpy = jest
      .spyOn(stream, 'beginInteraction')
      .mockReturnValue(Promise.resolve({}));
    const updateSpy = jest.spyOn(stream, 'updateInteraction');
    const endSpy = jest
      .spyOn(stream, 'endInteraction')
      .mockReturnValue(Promise.resolve({}));

    (convertCanvasPointToWorld as jest.Mock).mockImplementation(() =>
      Vector3.create(1, 1, 1)
    );
    (convertPointToCanvas as jest.Mock).mockImplementation(() =>
      Vector3.create(1, 1, 1)
    );
    (computeHandleDeltaTransform as jest.Mock).mockImplementation(() =>
      Matrix4.makeTranslation(Vector3.create(2, 2, 2))
    );

    widget.shadowRoot
      ?.querySelector('canvas')
      ?.dispatchEvent(new MouseEvent('pointerdown'));

    window.dispatchEvent(new MouseEvent('pointermove'));

    await Async.delay(75);

    await page.waitForChanges();

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

  it('supports input-based position transforms', async () => {
    const { stream, ws } = makeViewerStream();
    const page = await newSpecPage({
      components: [Viewer, ViewerTransformWidget],
      template: () => (
        <vertex-viewer stream={stream}>
          <vertex-viewer-transform-widget></vertex-viewer-transform-widget>
        </vertex-viewer>
      ),
    });

    (mockTransformWidget.getFullBounds as jest.Mock).mockReturnValue(
      Rectangle.create(0, 0, 100, 100)
    );

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
    await viewer.dispatchFrameDrawn(frame);

    widget.position = Vector3.create(0, 0, 0);
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
    jest.spyOn(stream, 'beginInteraction').mockReturnValue(Promise.resolve({}));
    const updateSpy = jest.spyOn(stream, 'updateInteraction');
    (convertCanvasPointToWorld as jest.Mock).mockImplementation(() =>
      Vector3.create(1, 1, 1)
    );
    (convertPointToCanvas as jest.Mock).mockImplementation(() =>
      Vector3.create(1, 1, 1)
    );
    (computeHandleDeltaTransform as jest.Mock).mockImplementation(() =>
      Matrix4.makeTranslation(Vector3.create(0, 0, 0))
    );

    widget.shadowRoot
      ?.querySelector('canvas')
      ?.dispatchEvent(new MouseEvent('pointerdown'));

    window.dispatchEvent(new MouseEvent('pointermove'));

    await page.waitForChanges();

    window.dispatchEvent(new MouseEvent('pointerup'));

    await page.waitForChanges();

    const input = widget.shadowRoot?.querySelector('input') as HTMLInputElement;

    input.value = '100';

    input.dispatchEvent(new Event('change'));

    await page.waitForChanges();

    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        transform: {
          delta: {
            basisX: Vector3.create(1, 0, 0),
            basisY: Vector3.create(0, 1, 0),
            basisZ: Vector3.create(0, 0, 1),
            xlate: Vector3.create(100, 0, 0),
            scale: 1,
          },
        },
      })
    );
  });

  it('supports input+keyboard based position transforms', async () => {
    const { stream, ws } = makeViewerStream();
    const page = await newSpecPage({
      components: [Viewer, ViewerTransformWidget],
      template: () => (
        <vertex-viewer stream={stream}>
          <vertex-viewer-transform-widget></vertex-viewer-transform-widget>
        </vertex-viewer>
      ),
    });

    (mockTransformWidget.getFullBounds as jest.Mock).mockReturnValue(
      Rectangle.create(0, 0, 100, 100)
    );

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
    await viewer.dispatchFrameDrawn(frame);

    widget.position = Vector3.create(0, 0, 0);
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
    jest.spyOn(stream, 'beginInteraction').mockReturnValue(Promise.resolve({}));
    const updateSpy = jest.spyOn(stream, 'updateInteraction');
    (convertCanvasPointToWorld as jest.Mock).mockImplementation(() =>
      Vector3.create(1, 1, 1)
    );
    (convertPointToCanvas as jest.Mock).mockImplementation(() =>
      Vector3.create(1, 1, 1)
    );
    (computeHandleDeltaTransform as jest.Mock).mockImplementation(() =>
      Matrix4.makeTranslation(Vector3.create(0, 0, 0))
    );

    widget.shadowRoot
      ?.querySelector('canvas')
      ?.dispatchEvent(new MouseEvent('pointerdown'));

    window.dispatchEvent(new MouseEvent('pointermove'));

    await page.waitForChanges();

    window.dispatchEvent(new MouseEvent('pointerup'));

    await page.waitForChanges();

    const input = widget.shadowRoot?.querySelector('input') as HTMLInputElement;

    dispatchKeydownEvent(input, 'ArrowUp', 2);

    await page.waitForChanges();

    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        transform: {
          delta: {
            basisX: Vector3.create(1, 0, 0),
            basisY: Vector3.create(0, 1, 0),
            basisZ: Vector3.create(0, 0, 1),
            xlate: Vector3.create(2, 0, 0),
            scale: 1,
          },
        },
      })
    );

    dispatchKeydownEvent(input, 'ArrowDown', 3);

    await page.waitForChanges();

    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        transform: {
          delta: {
            basisX: Vector3.create(1, 0, 0),
            basisY: Vector3.create(0, 1, 0),
            basisZ: Vector3.create(0, 0, 1),
            xlate: Vector3.create(-1, 0, 0),
            scale: 1,
          },
        },
      })
    );
  });

  it('supports input-based rotation transforms', async () => {
    const { stream, ws } = makeViewerStream();
    const page = await newSpecPage({
      components: [Viewer, ViewerTransformWidget],
      template: () => (
        <vertex-viewer stream={stream}>
          <vertex-viewer-transform-widget></vertex-viewer-transform-widget>
        </vertex-viewer>
      ),
    });

    (mockTransformWidget.getFullBounds as jest.Mock).mockReturnValue(
      Rectangle.create(0, 0, 100, 100)
    );

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
      'x-rotate',
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
    jest.spyOn(stream, 'beginInteraction').mockReturnValue(Promise.resolve({}));
    const updateSpy = jest.spyOn(stream, 'updateInteraction');
    (convertCanvasPointToWorld as jest.Mock).mockImplementation(() =>
      Vector3.create(1, 1, 1)
    );
    (convertPointToCanvas as jest.Mock).mockImplementation(() =>
      Vector3.create(1, 1, 1)
    );
    (computeHandleDeltaTransform as jest.Mock).mockImplementation(() =>
      Matrix4.makeTranslation(Vector3.create(0, 0, 0))
    );

    widget.shadowRoot
      ?.querySelector('canvas')
      ?.dispatchEvent(new MouseEvent('pointerdown'));

    window.dispatchEvent(new MouseEvent('pointermove'));

    await page.waitForChanges();

    window.dispatchEvent(new MouseEvent('pointerup'));

    await page.waitForChanges();
    updateSpy.mockClear();

    const input = widget.shadowRoot?.querySelector('input') as HTMLInputElement;

    input.value = '90';

    input.dispatchEvent(new Event('change'));

    await page.waitForChanges();

    const call = updateSpy.mock.calls[0][0];

    expect(call.transform?.delta?.basisY?.x).toBeCloseTo(0);
    expect(call.transform?.delta?.basisY?.y).toBeCloseTo(0);
    expect(call.transform?.delta?.basisY?.z).toBeCloseTo(-1);
    expect(call.transform?.delta?.basisZ?.x).toBeCloseTo(0);
    expect(call.transform?.delta?.basisZ?.y).toBeCloseTo(1);
    expect(call.transform?.delta?.basisZ?.z).toBeCloseTo(0);
  });

  it('supports input+keyboard based rotation transforms', async () => {
    const { stream, ws } = makeViewerStream();
    const page = await newSpecPage({
      components: [Viewer, ViewerTransformWidget],
      template: () => (
        <vertex-viewer stream={stream}>
          <vertex-viewer-transform-widget></vertex-viewer-transform-widget>
        </vertex-viewer>
      ),
    });

    (mockTransformWidget.getFullBounds as jest.Mock).mockReturnValue(
      Rectangle.create(0, 0, 100, 100)
    );

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
    await viewer.dispatchFrameDrawn(frame);

    widget.position = Vector3.create(1, 1, 1);
    widget.addEventListener('interactionEnded', onInteractionEnded);
    widget.addEventListener('interactionStarted', onInteractionStarted);

    await page.waitForChanges();

    widget.hovered = new TriangleMesh(
      jest.fn(),
      'x-rotate',
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
    jest.spyOn(stream, 'beginInteraction').mockReturnValue(Promise.resolve({}));
    const updateSpy = jest.spyOn(stream, 'updateInteraction');
    jest.spyOn(stream, 'endInteraction').mockReturnValue(Promise.resolve({}));
    (convertCanvasPointToWorld as jest.Mock).mockImplementation(() =>
      Vector3.create(1, 1, 1)
    );
    (convertPointToCanvas as jest.Mock).mockImplementation(() =>
      Vector3.create(1, 1, 1)
    );
    (computeHandleDeltaTransform as jest.Mock).mockImplementation(() =>
      Matrix4.makeTranslation(Vector3.create(0, 0, 0))
    );

    widget.shadowRoot
      ?.querySelector('canvas')
      ?.dispatchEvent(new MouseEvent('pointerdown'));

    window.dispatchEvent(new MouseEvent('pointermove'));

    await page.waitForChanges();

    window.dispatchEvent(new MouseEvent('pointerup'));

    await page.waitForChanges();
    updateSpy.mockClear();

    const input = widget.shadowRoot?.querySelector('input') as HTMLInputElement;

    dispatchKeydownEvent(input, 'ArrowUp', 90);

    await page.waitForChanges();

    expect(input.value).toBe('90');

    const call1 = updateSpy.mock.calls[0][0];

    expect(call1.transform?.delta?.basisY?.x).toBeCloseTo(0);
    expect(call1.transform?.delta?.basisY?.y).toBeCloseTo(0);
    expect(call1.transform?.delta?.basisY?.z).toBeCloseTo(-1);
    expect(call1.transform?.delta?.basisZ?.x).toBeCloseTo(0);
    expect(call1.transform?.delta?.basisZ?.y).toBeCloseTo(1);
    expect(call1.transform?.delta?.basisZ?.z).toBeCloseTo(0);

    // Update to radians to test increment behavior
    widget.angleUnit = 'radians';
    await page.waitForChanges();

    dispatchKeydownEvent(input, 'ArrowDown', 180);

    await page.waitForChanges();

    expect(input.value).toBe(Angle.toRadians(270).toFixed(1));

    const call2 = updateSpy.mock.calls[1][0];

    expect(call2.transform?.delta?.basisY?.x).toBeCloseTo(0);
    expect(call2.transform?.delta?.basisY?.y).toBeCloseTo(0);
    expect(call2.transform?.delta?.basisY?.z).toBeCloseTo(-1);
    expect(call2.transform?.delta?.basisZ?.x).toBeCloseTo(0);
    expect(call2.transform?.delta?.basisZ?.y).toBeCloseTo(1);
    expect(call2.transform?.delta?.basisZ?.z).toBeCloseTo(0);
  });

  it('supports an undo of the most recent transform', async () => {
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
    const beginSpy = jest
      .spyOn(stream, 'beginInteraction')
      .mockReturnValue(Promise.resolve({}));
    const updateSpy = jest.spyOn(stream, 'updateInteraction');
    const endSpy = jest
      .spyOn(stream, 'endInteraction')
      .mockReturnValue(Promise.resolve({}));

    (convertCanvasPointToWorld as jest.Mock).mockImplementation(() =>
      Vector3.create(1, 1, 1)
    );
    (convertPointToCanvas as jest.Mock).mockImplementation(() =>
      Vector3.create(1, 1, 1)
    );
    (computeHandleDeltaTransform as jest.Mock).mockImplementation(() =>
      Matrix4.makeTranslation(Vector3.create(2, 2, 2))
    );

    widget.shadowRoot
      ?.querySelector('canvas')
      ?.dispatchEvent(new MouseEvent('pointerdown'));

    window.dispatchEvent(new MouseEvent('pointermove'));

    await Async.delay(75);

    await page.waitForChanges();

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

    updateSpy.mockClear();

    widget.EXPERIMENTAL_undo();
    await page.waitForChanges();

    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        transform: {
          delta: {
            basisX: Vector3.create(1, 0, 0),
            basisY: Vector3.create(0, 1, 0),
            basisZ: Vector3.create(0, 0, 1),
            xlate: Vector3.create(-1, -1, -1),
            scale: 1,
          },
        },
      })
    );
  });

  it('supports scaling the transformation handles', async () => {
    const { stream, ws } = makeViewerStream();
    const position = Vector3.create(1, 1, 1);
    const page = await newSpecPage({
      components: [Viewer, ViewerTransformWidget],
      template: () => (
        <vertex-viewer stream={stream}>
          <vertex-viewer-transform-widget
            position={position}
          ></vertex-viewer-transform-widget>
        </vertex-viewer>
      ),
    });

    (mockTransformWidget.getFullBounds as jest.Mock).mockReturnValue(
      Rectangle.create(0, 0, 100, 100)
    );

    const viewer = page.body.querySelector(
      'vertex-viewer'
    ) as HTMLVertexViewerElement;
    const widget = page.body.querySelector(
      'vertex-viewer-transform-widget'
    ) as HTMLVertexViewerTransformWidgetElement;

    await loadViewerStreamKey(key1, { viewer, stream, ws });
    await page.waitForChanges();

    const frame = makePerspectiveFrame();
    viewer.dispatchFrameDrawn(frame);
    widget.translationHandleScalar = 2;
    widget.rotationHandleScalar = 3;

    await page.waitForChanges();

    expect(mockTransformWidget.updateScalars).toHaveBeenCalledWith({
      xTranslation: 2,
      yTranslation: 2,
      zTranslation: 2,
      xyTranslation: 3,
      xzTranslation: 3,
      yzTranslation: 3,
      xRotation: 3,
      yRotation: 3,
      zRotation: 3,
    });
  });

  it('falls back to default scale values for values at or below zero', async () => {
    const { stream, ws } = makeViewerStream();
    const position = Vector3.create(1, 1, 1);
    const page = await newSpecPage({
      components: [Viewer, ViewerTransformWidget],
      template: () => (
        <vertex-viewer stream={stream}>
          <vertex-viewer-transform-widget
            position={position}
          ></vertex-viewer-transform-widget>
        </vertex-viewer>
      ),
    });

    (mockTransformWidget.getFullBounds as jest.Mock).mockReturnValue(
      Rectangle.create(0, 0, 100, 100)
    );

    const viewer = page.body.querySelector(
      'vertex-viewer'
    ) as HTMLVertexViewerElement;
    const widget = page.body.querySelector(
      'vertex-viewer-transform-widget'
    ) as HTMLVertexViewerTransformWidgetElement;

    await loadViewerStreamKey(key1, { viewer, stream, ws });
    await page.waitForChanges();

    const frame = makePerspectiveFrame();
    viewer.dispatchFrameDrawn(frame);
    widget.translationHandleScalar = 0;
    widget.rotationHandleScalar = -1;

    await page.waitForChanges();

    expect(mockTransformWidget.updateScalars).toHaveBeenCalledWith({
      xTranslation: 1,
      yTranslation: 1,
      zTranslation: 1,
      xyTranslation: 1,
      xzTranslation: 1,
      yzTranslation: 1,
      xRotation: 1,
      yRotation: 1,
      zRotation: 1,
    });
  });

  it('performs a transform when initialized with a position', async () => {
    const { stream, ws } = makeViewerStream();
    const position = Vector3.create(0, 0, 0);
    const page = await newSpecPage({
      components: [Viewer, ViewerTransformWidget],
      template: () => (
        <vertex-viewer stream={stream}>
          <vertex-viewer-transform-widget
            position={position}
          ></vertex-viewer-transform-widget>
        </vertex-viewer>
      ),
    });

    (mockTransformWidget.getFullBounds as jest.Mock).mockReturnValue(
      Rectangle.create(0, 0, 100, 100)
    );

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
    const beginSpy = jest
      .spyOn(stream, 'beginInteraction')
      .mockReturnValue(Promise.resolve({}));
    const updateSpy = jest.spyOn(stream, 'updateInteraction');
    const endSpy = jest
      .spyOn(stream, 'endInteraction')
      .mockReturnValue(Promise.resolve({}));

    (convertCanvasPointToWorld as jest.Mock).mockImplementation(() =>
      Vector3.create(1, 1, 1)
    );
    (convertPointToCanvas as jest.Mock).mockImplementation(() =>
      Vector3.create(1, 1, 1)
    );
    (computeHandleDeltaTransform as jest.Mock).mockImplementation(() =>
      Matrix4.makeTranslation(Vector3.create(1, 1, 1))
    );

    widget.shadowRoot
      ?.querySelector('canvas')
      ?.dispatchEvent(new MouseEvent('pointerdown'));

    window.dispatchEvent(new MouseEvent('pointermove'));

    await Async.delay(75);

    await page.waitForChanges();

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

    const input = widget.shadowRoot?.querySelector('input');
    const units = widget.shadowRoot?.querySelector('.widget-input.units');

    expect(onInteractionEnded).toHaveBeenCalled();
    expect(onInteractionStarted).toHaveBeenCalled();
    expect(input?.value).toBe('1');
    expect(units?.innerHTML).toBe('mm');
  });

  it('sets the widget to disabled on an interaction, and re-enables available axis', async () => {
    const { stream, ws } = makeViewerStream();
    const position = Vector3.create(1, 1, 1);
    const page = await newSpecPage({
      components: [Viewer, ViewerTransformWidget],
      template: () => (
        <vertex-viewer stream={stream}>
          <vertex-viewer-transform-widget
            xRotationDisabled={true}
            yRotationDisabled={true}
            zRotationDisabled={true}
            position={position}
          ></vertex-viewer-transform-widget>
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

    const frame = makePerspectiveFrame();
    viewer.dispatchFrameDrawn(frame);

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

    widget.shadowRoot
      ?.querySelector('canvas')
      ?.dispatchEvent(new MouseEvent('pointerdown'));

    window.dispatchEvent(new MouseEvent('pointermove'));

    window.dispatchEvent(new MouseEvent('pointerup'));

    await page.waitForChanges();

    expect(mockTransformWidget.updateDisabledAxis).toHaveBeenCalledWith({
      xRotation: true,
      yRotation: true,
      zRotation: true,
      xTranslation: true,
      yTranslation: true,
      zTranslation: true,
      xyTranslation: true,
      xzTranslation: true,
      yzTranslation: true,
    });

    expect(mockTransformWidget.updateDisabledAxis).toHaveBeenCalledWith({
      xRotation: true,
      yRotation: true,
      zRotation: true,
      xTranslation: false,
      yTranslation: false,
      zTranslation: false,
      xyTranslation: false,
      xzTranslation: false,
      yzTranslation: false,
    });
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

    await loadViewerStreamKey(key1, { viewer, stream, ws });
    await page.waitForChanges();
    await page.waitForChanges();

    const frame = makePerspectiveFrame();
    viewer.dispatchFrameDrawn(frame);

    widget.position = Vector3.create(1, 1, 1);

    await page.waitForChanges();

    viewer.viewport = new Viewport(5000, 5000);

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

    jest.spyOn(stream, 'beginInteraction').mockReturnValue(Promise.resolve({}));
    const endSpy = jest.spyOn(stream, 'endInteraction');

    (convertCanvasPointToWorld as jest.Mock).mockImplementation(() =>
      Vector3.create(1, 1, 1)
    );
    (convertPointToCanvas as jest.Mock).mockImplementation(() =>
      Vector3.create(1, 1, 1)
    );
    (computeHandleDeltaTransform as jest.Mock).mockImplementation(() =>
      Vector3.create(2, 2, 2)
    );

    widget.shadowRoot
      ?.querySelector('canvas')
      ?.dispatchEvent(new MouseEvent('pointerdown'));

    window.dispatchEvent(new MouseEvent('pointermove'));

    await Async.delay(75);

    await page.waitForChanges();

    (mockTransformWidget.updateTransform as jest.Mock).mockClear();
    widget.position = undefined;

    await page.waitForChanges();

    expect(endSpy).toHaveBeenCalled();
    expect(mockTransformWidget.updateTransform).toHaveBeenCalledWith(undefined);
  });

  it('clears the widget position if the component rotation is cleared and there is no translation', async () => {
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
    widget.rotation = Euler.create({ x: 1, y: 1, z: 1 });
    await page.waitForChanges();

    (mockTransformWidget.updateTransform as jest.Mock).mockClear();
    widget.position = undefined;
    await page.waitForChanges();
    widget.rotation = undefined;
    await page.waitForChanges();

    expect(mockTransformWidget.updateTransform).toHaveBeenNthCalledWith(
      1,
      undefined
    );
    expect(mockTransformWidget.updateTransform).toHaveBeenNthCalledWith(
      2,
      undefined
    );
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
