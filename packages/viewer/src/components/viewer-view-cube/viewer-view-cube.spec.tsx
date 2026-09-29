import type { Mock } from '#test/mock-types';
vi.mock('../viewer/utils');
vi.mock('../../lib/rendering/imageLoaders');

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h } from '@stencil/core';
import { render } from '@stencil/vitest';
import { BoundingBox, Vector3 } from '@vertexvis/geometry';

import { loadImageBytes } from '../../lib/rendering/imageLoaders';
import { FramePerspectiveCamera, Orientation } from '../../lib/types';
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

// Register source components in the Stencil Vitest environment.
void [
  Viewer,
  ViewerDomElement,
  ViewerDomGroup,
  ViewerDomRenderer,
  ViewerViewCube,
];

describe('vertex-viewer-view-cube', () => {
  (loadImageBytes as Mock).mockResolvedValue({
    width: 200,
    height: 150,
    dispose: () => undefined,
  });
  (getElementBoundingClientRect as Mock).mockReturnValue({
    left: 0,
    top: 0,
    bottom: 150,
    right: 200,
    width: 200,
    height: 150,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('renders a triad', async () => {
    const { root, waitForChanges } = await render(<vertex-viewer-view-cube />, {
      waitForReady: false,
    });
    await waitForChanges();

    expect(root.shadowRoot?.querySelector('.triad')).toBeDefined();
  });

  it('observes the renderer again after reattachment', async () => {
    const { root, waitForChanges } = await render(<vertex-viewer-view-cube />, {
      waitForReady: false,
    });
    await waitForChanges();

    const renderer = root.shadowRoot?.querySelector('.renderer');
    const observe = vi.spyOn(ResizeObserver.prototype, 'observe');
    const parent = root.parentElement;

    root.remove();
    parent?.appendChild(root);
    await waitForChanges();

    expect(observe).toHaveBeenCalledWith(renderer);
    observe.mockRestore();
  });

  it('does not render triad if disabled', async () => {
    const { root, waitForChanges } = await render(
      <vertex-viewer-view-cube triadOff />,
      {
        waitForReady: false,
      },
    );
    await waitForChanges();

    expect(root.shadowRoot?.querySelector('.triad')).toBeNull();
  });

  it('shows custom labels for cube', async () => {
    const { root, waitForChanges } = await render(
      <vertex-viewer-view-cube
        xPositiveLabel="x-pos"
        xNegativeLabel="x-neg"
        yPositiveLabel="y-pos"
        yNegativeLabel="y-neg"
        zPositiveLabel="z-pos"
        zNegativeLabel="z-neg"
      />,
      { waitForReady: false },
    );
    await waitForChanges();

    expect(root.shadowRoot?.querySelector('.cube-side-face-x-pos')).toEqualText(
      'x-pos',
    );
    expect(root.shadowRoot?.querySelector('.cube-side-face-x-neg')).toEqualText(
      'x-neg',
    );
    expect(root.shadowRoot?.querySelector('.cube-side-face-y-pos')).toEqualText(
      'y-pos',
    );
    expect(root.shadowRoot?.querySelector('.cube-side-face-y-neg')).toEqualText(
      'y-neg',
    );
    expect(root.shadowRoot?.querySelector('.cube-side-face-z-pos')).toEqualText(
      'z-pos',
    );
    expect(root.shadowRoot?.querySelector('.cube-side-face-z-neg')).toEqualText(
      'z-neg',
    );
  });

  it('uses world orientation for cube', async () => {
    const worldOrientation = new Orientation(Vector3.left(), Vector3.down());
    const page = await render(<vertex-viewer-view-cube />, {
      waitForReady: false,
    });
    await page.waitForChanges();

    const root = page.root as HTMLVertexViewerViewCubeElement;
    const cube = root.shadowRoot?.querySelector(
      '.cube',
    ) as HTMLVertexViewerDomGroupElement;

    root.worldOrientation = worldOrientation;
    await page.waitForChanges();
    expect(cube.matrix).toEqual(worldOrientation.matrix);
  });

  it('orients cube and triad based on camera', async () => {
    const camera = new FramePerspectiveCamera(
      Vector3.right(),
      Vector3.origin(),
      Vector3.down(),
      0.1,
      100,
      2,
      45,
    );
    const { root, waitForChanges } = await render(
      <vertex-viewer-view-cube camera={camera} />,
      {
        waitForReady: false,
      },
    );
    await waitForChanges();
    const renderer = root.shadowRoot?.querySelector(
      '.renderer',
    ) as HTMLVertexViewerDomRendererElement;

    /* eslint-disable @typescript-eslint/no-non-null-assertion */
    expect(Vector3.normalize(renderer.camera!.position)).toEqual(
      Vector3.right(),
    );
    expect(renderer.camera!.lookAt).toEqual(Vector3.origin());
    expect(renderer.camera!.up).toEqual(camera.up);
    /* eslint-enable @typescript-eslint/no-non-null-assertion */
  });

  it('applies camera from viewer', async () => {
    const { stream, ws } = makeViewerStream();
    const page = await render(
      <vertex-viewer stream={stream}>
        <vertex-viewer-view-cube />
      </vertex-viewer>,
      { waitForReady: false },
    );
    await page.waitForChanges();

    const viewer = document.body.querySelector(
      'vertex-viewer',
    ) as HTMLVertexViewerElement;
    const viewCube = document.body.querySelector(
      'vertex-viewer-view-cube',
    ) as HTMLVertexViewerViewCubeElement;

    await loadViewerStreamKey(key1, { viewer, stream, ws });
    await page.waitForChanges();
    await page.waitForChanges();

    expect(viewCube.camera).toBeDefined();
    expect(viewCube.worldOrientation).toBeDefined();
  });
});

describe('vertex-viewer-view-cube interactions', () => {
  const cameraMock = {
    standardView: vi.fn(),
    standardViewFixedLookAt: vi.fn(),
    viewAll: vi.fn(),
    render: vi.fn(),
  };
  const sceneMock = {
    boundingBox: vi.fn(
      (): ReturnType<typeof BoundingBox.create> | undefined => undefined,
    ),
    camera: vi.fn(() => cameraMock),
  };
  const viewerElement = {
    scene: vi.fn(async () => sceneMock),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  } as unknown as HTMLVertexViewerElement;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    cameraMock.standardView.mockReturnValue(cameraMock);
    cameraMock.standardViewFixedLookAt.mockReturnValue(cameraMock);
    cameraMock.viewAll.mockReturnValue(cameraMock);
    sceneMock.boundingBox.mockReturnValue(undefined);
  });

  it('performs standard view when side clicked', async () => {
    const page = await render(
      <vertex-viewer-view-cube viewer={viewerElement} />,
      {
        waitForReady: false,
      },
    );
    await page.waitForChanges();

    const frontEl = page.root.shadowRoot?.querySelector(
      '.cube-side-face-front',
    );
    frontEl?.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));

    await vi.waitFor(() => expect(cameraMock.render).toHaveBeenCalled());

    expect(cameraMock.standardView).toHaveBeenCalledWith(
      expect.objectContaining({
        position: Vector3.back(),
        up: Vector3.up(),
      }),
    );
    expect(cameraMock.viewAll).toHaveBeenCalled();
    expect(cameraMock.render).toHaveBeenCalledWith(
      expect.objectContaining({
        animation: expect.objectContaining({
          milliseconds: 500,
        }),
      }),
    );
  });

  it('performs a standard view without a fit all when side clicked with viewAll set to false', async () => {
    const page = await render(
      <vertex-viewer-view-cube viewer={viewerElement} viewAll={false} />,
      { waitForReady: false },
    );
    await page.waitForChanges();

    const frontEl = page.root.shadowRoot?.querySelector(
      '.cube-side-face-front',
    );
    frontEl?.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));

    await vi.waitFor(() => expect(cameraMock.render).toHaveBeenCalled());

    expect(cameraMock.standardViewFixedLookAt).toHaveBeenCalledWith(
      expect.objectContaining({
        position: Vector3.back(),
        up: Vector3.up(),
      }),
    );
    expect(cameraMock.viewAll).not.toHaveBeenCalled();
    expect(cameraMock.render).toHaveBeenCalledWith(
      expect.objectContaining({
        animation: expect.objectContaining({
          milliseconds: 500,
        }),
      }),
    );
  });

  it('performs standard view when side clicked with no visible geometry', async () => {
    sceneMock.boundingBox.mockReturnValue(
      BoundingBox.create(Vector3.origin(), Vector3.origin()),
    );

    const page = await render(
      <vertex-viewer-view-cube viewer={viewerElement} />,
      {
        waitForReady: false,
      },
    );
    await page.waitForChanges();

    const frontEl = page.root.shadowRoot?.querySelector(
      '.cube-side-face-front',
    );
    frontEl?.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));

    await vi.waitFor(() => expect(cameraMock.render).toHaveBeenCalled());

    expect(cameraMock.standardView).toHaveBeenCalledWith(
      expect.objectContaining({
        position: Vector3.back(),
        up: Vector3.up(),
      }),
    );
    expect(cameraMock.viewAll).not.toHaveBeenCalled();
    expect(cameraMock.render).toHaveBeenCalledWith(
      expect.objectContaining({
        animation: expect.objectContaining({
          milliseconds: 500,
        }),
      }),
    );
  });

  it('does not animation if animation duration is 0', async () => {
    const page = await render(
      <vertex-viewer-view-cube viewer={viewerElement} animationDuration={0} />,
      { waitForReady: false },
    );
    await page.waitForChanges();

    const frontEl = page.root.shadowRoot?.querySelector(
      '.cube-side-face-front',
    );
    frontEl?.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));

    await vi.waitFor(() => expect(cameraMock.render).toHaveBeenCalled());

    expect(cameraMock.render).toHaveBeenCalledWith({});
  });

  it('does not perform standard view if disabled', async () => {
    const page = await render(
      <vertex-viewer-view-cube viewer={viewerElement} standardViewsOff />,
      { waitForReady: false },
    );
    await page.waitForChanges();

    const frontEl = page.root.shadowRoot?.querySelector(
      '.cube-side-face-front',
    );
    frontEl?.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));

    await Promise.resolve();

    expect(viewerElement.scene).not.toHaveBeenCalled();
    expect(cameraMock.render).not.toHaveBeenCalled();
  });
});
