jest.mock('../viewer/utils');
jest.mock('../../lib/rendering/imageLoaders');

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';
import { Vector3 } from '@vertexvis/geometry';

import { loadImageBytes } from '../../lib/rendering/imageLoaders';
import { FrameCameraBase, Orientation } from '../../lib/types';
import {
  key1,
  loadViewerStreamKey,
  makeViewerStream,
} from '../../testing/viewer';
import { getElementBoundingClientRect } from '../viewer/utils';
import { Viewer } from '../viewer/viewer';
import { ViewerDomElement } from '../viewer-dom-element/viewer-dom-element';
import { ViewerDomGroup } from '../viewer-dom-group/viewer-dom-group';
import { ViewerDomRenderer } from '../viewer-dom-renderer/viewer-dom-renderer';
import { ViewerViewCube } from './viewer-view-cube';

describe('vertex-viewer-view-cube', () => {
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
    jest.restoreAllMocks();
  });

  it('renders a triad', async () => {
    const page = await newSpecPage({
      components: [ViewerViewCube],
      html: `<vertex-viewer-view-cube></vertex-viewer-view-cube>`,
    });

    expect(page.root?.shadowRoot?.querySelector('.triad')).toBeDefined();
  });

  it('does not render triad if disabled', async () => {
    const page = await newSpecPage({
      components: [ViewerViewCube],
      html: `<vertex-viewer-view-cube triad-off></vertex-viewer-view-cube>`,
    });

    expect(page.root?.shadowRoot?.querySelector('.triad')).toBeNull();
  });

  it('shows custom labels for cube', async () => {
    const page = await newSpecPage({
      components: [ViewerViewCube],
      html: `
        <vertex-viewer-view-cube
          x-positive-label="x-pos"
          x-negative-label="x-neg"
          y-positive-label="y-pos"
          y-negative-label="y-neg"
          z-positive-label="z-pos"
          z-negative-label="z-neg"
        ></vertex-viewer-view-cube>
      `,
    });

    expect(
      page.root?.shadowRoot?.querySelector('.cube-side-face-x-pos')
    ).toEqualText('x-pos');
    expect(
      page.root?.shadowRoot?.querySelector('.cube-side-face-x-neg')
    ).toEqualText('x-neg');
    expect(
      page.root?.shadowRoot?.querySelector('.cube-side-face-y-pos')
    ).toEqualText('y-pos');
    expect(
      page.root?.shadowRoot?.querySelector('.cube-side-face-y-neg')
    ).toEqualText('y-neg');
    expect(
      page.root?.shadowRoot?.querySelector('.cube-side-face-z-pos')
    ).toEqualText('z-pos');
    expect(
      page.root?.shadowRoot?.querySelector('.cube-side-face-z-neg')
    ).toEqualText('z-neg');
  });

  it('uses world orientation for cube', async () => {
    const worldOrientation = new Orientation(Vector3.left(), Vector3.down());
    const page = await newSpecPage({
      components: [
        ViewerDomRenderer,
        ViewerDomElement,
        ViewerDomGroup,
        ViewerViewCube,
      ],
      template: () => <vertex-viewer-view-cube />,
    });

    const root = page.root as HTMLVertexViewerViewCubeElement;
    const cube = root.shadowRoot?.querySelector(
      '.cube'
    ) as HTMLVertexViewerDomGroupElement;

    root.worldOrientation = worldOrientation;
    await page.waitForChanges();
    expect(cube.matrix).toEqual(worldOrientation.matrix);
  });

  it('orients cube and triad based on camera', async () => {
    const camera = new FrameCameraBase(
      Vector3.right(),
      Vector3.origin(),
      Vector3.down(),
      0.1,
      100,
      2,
      45
    );
    const page = await newSpecPage({
      components: [ViewerDomRenderer, ViewerViewCube],
      template: () => <vertex-viewer-view-cube camera={camera} />,
    });
    const renderer = page.root?.shadowRoot?.querySelector(
      '.renderer'
    ) as HTMLVertexViewerDomRendererElement;

    /* eslint-disable @typescript-eslint/no-non-null-assertion */
    expect(Vector3.normalize(renderer.camera!.position)).toEqual(
      Vector3.right()
    );
    expect(renderer.camera!.lookAt).toEqual(Vector3.origin());
    expect(renderer.camera!.up).toEqual(camera.up);
    /* eslint-enable @typescript-eslint/no-non-null-assertion */
  });

  it('applies camera from viewer', async () => {
    const { stream, ws } = makeViewerStream();
    const page = await newSpecPage({
      components: [Viewer, ViewerViewCube],
      template: () => (
        <vertex-viewer stream={stream}>
          <vertex-viewer-view-cube></vertex-viewer-view-cube>
        </vertex-viewer>
      ),
    });

    const viewer = page.body.querySelector(
      'vertex-viewer'
    ) as HTMLVertexViewerElement;
    const viewCube = page.body.querySelector(
      'vertex-viewer-view-cube'
    ) as HTMLVertexViewerViewCubeElement;

    await loadViewerStreamKey(key1, { viewer, stream, ws });
    await page.waitForChanges();
    await page.waitForChanges();

    expect(viewCube.camera).toBeDefined();
    expect(viewCube.worldOrientation).toBeDefined();
  });
});

import {
  awaitScene,
  cameraMock,
  resetAwaiter,
  sceneMock,
  viewer,
} from '../viewer/__mocks__/mocks';

describe('vertex-viewer-view-cube interactions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    resetAwaiter(sceneMock);
  });

  it('performs standard view when side clicked', async () => {
    const page = await newSpecPage({
      components: [ViewerViewCube],
      template: () => <vertex-viewer-view-cube />,
    });

    page.rootInstance.viewer = viewer;

    const frontEl = page.root?.shadowRoot?.querySelector(
      '.cube-side-face-front'
    );
    frontEl?.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));

    await awaitScene;

    expect(cameraMock.standardView).toHaveBeenCalledWith(
      expect.objectContaining({
        position: Vector3.back(),
        up: Vector3.up(),
      })
    );
    expect(cameraMock.viewAll).toHaveBeenCalled();
    expect(cameraMock.render).toHaveBeenCalledWith(
      expect.objectContaining({
        animation: expect.objectContaining({
          milliseconds: 500,
        }),
      })
    );
  });

  it('does not animation if animation duration is 0', async () => {
    const page = await newSpecPage({
      components: [ViewerViewCube],
      template: () => <vertex-viewer-view-cube animationDuration={0} />,
    });

    page.rootInstance.viewer = viewer;

    const frontEl = page.root?.shadowRoot?.querySelector(
      '.cube-side-face-front'
    );
    frontEl?.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));

    await awaitScene;

    expect(cameraMock.render).toHaveBeenCalledWith({});
  });

  it('does not perform standard view if disabled', async () => {
    const page = await newSpecPage({
      components: [ViewerViewCube],
      template: () => <vertex-viewer-view-cube standardViewsOff />,
    });

    page.rootInstance.viewer = viewer;

    const frontEl = page.root?.shadowRoot?.querySelector(
      '.cube-side-face-front'
    );
    frontEl?.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));

    await viewer.scene();
    await awaitScene;

    expect(cameraMock.render).not.toHaveBeenCalled();
  });
});
