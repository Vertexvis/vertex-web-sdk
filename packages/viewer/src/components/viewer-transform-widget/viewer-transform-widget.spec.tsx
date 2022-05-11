jest.mock('../viewer/utils');
jest.mock('../../lib/rendering/imageLoaders');
jest.mock('regl-shape');
jest.mock('regl');
jest.mock('./widget');

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';
import { Vector3 } from '@vertexvis/geometry';
import regl from 'regl';
import shapeBuilder from 'regl-shape';

import { loadImageBytes } from '../../lib/rendering/imageLoaders';
import { makePerspectiveFrame } from '../../testing/fixtures';
import {
  key1,
  loadViewerStreamKey,
  makeViewerStream,
} from '../../testing/viewer';
import { getElementBoundingClientRect } from '../viewer/utils';
import { Viewer } from '../viewer/viewer';
import { ViewerTransformWidget } from './viewer-transform-widget';
import { TransformWidget } from './widget';

type MockShapeBuilder = jest.Mock<{ createShape: jest.Mock }>;

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

    expect(mockTransformWidget.updatePosition).toHaveBeenCalledWith(
      widget.position
    );
    expect(mockTransformWidget.updateFrame).toHaveBeenCalledWith(frame, true);
  });
});
