jest.mock('../viewer/utils');
jest.mock('../../lib/rendering/imageLoaders');
jest.mock('./lib/indicator');
jest.mock('../../lib/stencil', () => ({
  readDOM: jest.fn((callback) => callback()),
  writeDOM: jest.fn((callback) => callback()),
}));

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';
import { Matrix4, Vector3 } from '@vertexvis/geometry';

import { loadImageBytes } from '../../lib/rendering/imageLoaders';
import { Viewport } from '../../lib/types';
import { makePerspectiveFrame } from '../../testing/fixtures';
import {
  key1,
  loadViewerStreamKey,
  makeViewerStream,
} from '../../testing/viewer';
import { getElementBoundingClientRect } from '../viewer/utils';
import { Viewer } from '../viewer/viewer';
import { HitIndicator } from './lib/indicator';
import { ViewerHitResultIndicator } from './viewer-hit-result-indicator';

describe('<vertex-viewer-hit-result-indicator>', () => {
  const mockIndicator = new HitIndicator(document.createElement('canvas'));

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

  it('displays an indicator at the provided position and normal', async () => {
    const page = await newSpecPage({
      components: [ViewerHitResultIndicator],
      html: `<vertex-viewer-hit-result-indicator></vertex-viewer-hit-result-indicator>`,
    });

    expect(page.root?.shadowRoot?.querySelector('canvas')).toBeDefined();
  });

  it('renders an indicator at the provided position and normal', async () => {
    const { stream, ws } = makeViewerStream();
    const page = await newSpecPage({
      components: [Viewer, ViewerHitResultIndicator],
      template: () => (
        <vertex-viewer stream={stream}>
          <vertex-viewer-hit-result-indicator></vertex-viewer-hit-result-indicator>
        </vertex-viewer>
      ),
    });

    const viewer = page.body.querySelector(
      'vertex-viewer'
    ) as HTMLVertexViewerElement;
    const indicator = page.body.querySelector(
      'vertex-viewer-hit-result-indicator'
    ) as HTMLVertexViewerHitResultIndicatorElement;

    await loadViewerStreamKey(key1, { viewer, stream, ws });
    await page.waitForChanges();

    const frame = makePerspectiveFrame();
    await viewer.dispatchFrameDrawn(frame);

    indicator.position = Vector3.create(1, 1, 1);
    indicator.normal = Vector3.up();

    await page.waitForChanges();

    expect(mockIndicator.updateTransformAndNormal).toHaveBeenCalledWith(
      Matrix4.makeTranslation(indicator.position),
      indicator.normal
    );
    expect(mockIndicator.updateFrame).toHaveBeenCalledWith(frame);
  });

  it('updates and redraws the indicator when the viewer dimensions change', async () => {
    const { stream, ws } = makeViewerStream();
    const page = await newSpecPage({
      components: [Viewer, ViewerHitResultIndicator],
      template: () => (
        <vertex-viewer stream={stream}>
          <vertex-viewer-hit-result-indicator></vertex-viewer-hit-result-indicator>
        </vertex-viewer>
      ),
    });

    const viewer = page.body.querySelector(
      'vertex-viewer'
    ) as HTMLVertexViewerElement;
    const indicator = page.body.querySelector(
      'vertex-viewer-hit-result-indicator'
    ) as HTMLVertexViewerHitResultIndicatorElement;

    await loadViewerStreamKey(key1, { viewer, stream, ws });
    await page.waitForChanges();

    const frame = makePerspectiveFrame();
    await viewer.dispatchFrameDrawn(frame);

    indicator.position = Vector3.create(1, 1, 1);

    await page.waitForChanges();

    viewer.viewport = new Viewport(5000, 5000);

    viewer.dispatchEvent(new CustomEvent('dimensionschange'));

    await page.waitForChanges();

    expect(mockIndicator.updateAndDraw).toHaveBeenCalled();
  });
});
