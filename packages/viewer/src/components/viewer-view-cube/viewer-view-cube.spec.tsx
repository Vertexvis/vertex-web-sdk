jest.mock('../viewer/utils');

import '../../testing/domMocks';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';
import { Matrix4, Vector3 } from '@vertexvis/geometry';
import { ViewerViewCube } from './viewer-view-cube';
import { Orientation } from '../../lib/types';
import { loadModelForViewer } from '../../testing/viewer';
import { Viewer } from '../viewer/viewer';
import { getElementBoundingClientRect } from '../viewer/utils';

describe('<vertex-viewer-view-cube>', () => {
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

  it('renders cube with default labels', async () => {
    const page = await newSpecPage({
      components: [ViewerViewCube],
      html: `<vertex-viewer-view-cube></vertex-viewer-view-cube>`,
    });

    const front = page.root?.shadowRoot?.querySelector('.cube-face-front');
    const back = page.root?.shadowRoot?.querySelector('.cube-face-back');
    const left = page.root?.shadowRoot?.querySelector('.cube-face-left');
    const right = page.root?.shadowRoot?.querySelector('.cube-face-right');
    const top = page.root?.shadowRoot?.querySelector('.cube-face-top');
    const bottom = page.root?.shadowRoot?.querySelector('.cube-face-bottom');

    expect(front?.textContent).toBe('Front');
    expect(back?.textContent).toBe('Back');
    expect(left?.textContent).toBe('Left');
    expect(right?.textContent).toBe('Right');
    expect(top?.textContent).toBe('Top');
    expect(bottom?.textContent).toBe('Bottom');
  });

  it('renders cube with custom labels', async () => {
    const page = await newSpecPage({
      components: [ViewerViewCube],
      html: `
      <vertex-viewer-view-cube
        x-positive-label="xpos"
        x-negative-label="xneg"
      >
      </vertex-viewer-view-cube>`,
    });

    const left = page.root?.shadowRoot?.querySelector('.cube-face-left');
    const right = page.root?.shadowRoot?.querySelector('.cube-face-right');

    expect(left?.textContent).toBe('xneg');
    expect(right?.textContent).toBe('xpos');
  });

  it('orients view cube to the view matrix with no position', async () => {
    const viewMatrix = Matrix4.makeLookAtView(
      Vector3.back(),
      Vector3.origin(),
      Vector3.up()
    );
    const appliedMatrix = Matrix4.position(viewMatrix, Matrix4.makeIdentity());

    const page = await newSpecPage({
      components: [ViewerViewCube],
      template: () => (
        <div>
          <vertex-viewer-view-cube viewMatrix={viewMatrix} />
        </div>
      ),
    });

    const el = page.root?.shadowRoot?.querySelector('.cube') as HTMLElement;
    expect(el?.style.transform).toContain(
      `matrix3d(${appliedMatrix.join(', ')})`
    );
  });

  it('applies the world transform to the view matrix', async () => {
    const viewMatrix = Matrix4.makeLookAtView(
      Vector3.back(),
      Vector3.origin(),
      Vector3.up()
    );
    const orientation = new Orientation(Vector3.forward(), Vector3.up());

    const m = Matrix4.position(viewMatrix, Matrix4.makeIdentity());
    const appliedMatrix = Matrix4.multiply(m, orientation.matrix);

    const page = await newSpecPage({
      components: [ViewerViewCube],
      template: () => (
        <div>
          <vertex-viewer-view-cube
            viewMatrix={viewMatrix}
            worldOrientation={orientation}
          />
        </div>
      ),
    });

    const el = page.root?.shadowRoot?.querySelector('.cube') as HTMLElement;
    expect(el?.style.transform).toContain(
      `matrix3d(${appliedMatrix.join(', ')})`
    );
  });

  it('applies camera and world transform from viewer', async () => {
    const page = await newSpecPage({
      components: [Viewer, ViewerViewCube],
      html: `
        <vertex-viewer>
          <vertex-viewer-view-cube></vertex-viewer-view-cube>
        </vertex-viewer>
      `,
    });

    const viewer = page.body.querySelector(
      'vertex-viewer'
    ) as HTMLVertexViewerElement;
    const viewCube = page.body.querySelector('vertex-viewer-view-cube');
    const el = viewCube?.shadowRoot?.querySelector('.cube') as HTMLElement;

    await loadModelForViewer(viewer);
    await page.waitForChanges();

    expect(el?.style.transform).toContain(`matrix3d`);
  });

  it('sets hovered selector when mouse entered', async () => {
    const page = await newSpecPage({
      components: [ViewerViewCube],
      html: `<vertex-viewer-view-cube></vertex-viewer-view-cube>`,
    });

    const el = page.root?.shadowRoot?.getElementById('top-front');
    el?.dispatchEvent(new MouseEvent('mouseenter'));

    await page.waitForChanges();

    expect(el?.className).toContain('hovered');
  });

  it('removes hovered selector when mouse leave', async () => {
    const page = await newSpecPage({
      components: [ViewerViewCube],
      html: `<vertex-viewer-view-cube></vertex-viewer-view-cube>`,
    });

    const el = page.root?.shadowRoot?.getElementById('top-front');
    el?.dispatchEvent(new MouseEvent('mouseenter'));
    await page.waitForChanges();

    el?.dispatchEvent(new MouseEvent('mouseleave'));
    await page.waitForChanges();

    expect(el?.className).not.toContain('hovered');
  });
});

import {
  sceneMock,
  cameraMock,
  viewer,
  resetAwaiter,
  awaitScene,
} from '../viewer/__mocks__/mocks';

describe('<vertex-viewer-view-cube> interactions', () => {
  beforeEach(() => {
    resetAwaiter(sceneMock);
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('performs standard view when side clicked', async () => {
    const page = await newSpecPage({
      components: [ViewerViewCube],
      html: `<vertex-viewer-view-cube></vertex-viewer-view-cube>`,
    });

    page.rootInstance.viewer = viewer;

    const frontEl = page.root?.shadowRoot?.getElementById('front');
    frontEl?.dispatchEvent(new MouseEvent('mousedown'));

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

  it('will not animate standard view if animation duration is 0', async () => {
    const page = await newSpecPage({
      components: [ViewerViewCube],
      html: `<vertex-viewer-view-cube animation-duration="0"></vertex-viewer-view-cube>`,
    });

    page.rootInstance.viewer = viewer;

    const frontEl = page.root?.shadowRoot?.getElementById('front');
    frontEl?.dispatchEvent(new MouseEvent('mousedown'));

    await awaitScene;

    expect(cameraMock.render).toHaveBeenCalledWith({});
  });

  it('does not perform standard view if disabled', async () => {
    const page = await newSpecPage({
      components: [ViewerViewCube],
      html: `<vertex-viewer-view-cube standard-views-disabled></vertex-viewer-view-cube>`,
    });

    page.rootInstance.viewer = viewer;

    const frontEl = page.root?.shadowRoot?.getElementById('front');
    frontEl?.dispatchEvent(new MouseEvent('mousedown'));

    await viewer.scene();
    await awaitScene;

    expect(cameraMock.render).not.toHaveBeenCalled();
  });
});
