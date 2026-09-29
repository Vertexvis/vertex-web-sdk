import '../../viewer-dom-renderer/viewer-dom-renderer';
import '../../viewer-pin-group/viewer-pin-group';
import '../../viewer-pin-label/viewer-pin-label';
import '../../viewer-pin-label-line/viewer-pin-label-line';
import '../viewer-pin-tool';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { describe, expect, h, it } from '@stencil/vitest';
import { Matrix4, Point, Vector3 } from '@vertexvis/geometry';

import { renderSource as render } from '#test/render-spec-page';

import { TextPin } from '../../../lib/pins/model';
import { viewer } from '../../viewer/__mocks__/mocks';

describe('vertex-viewer-pin-tool', () => {
  const pin: TextPin = {
    type: 'text',
    id: 'my-pin-id',
    worldPosition: Vector3.create(),
    label: {
      point: Point.create(0, 0),
      text: 'My New Pin',
    },
  };
  const addEventListener = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('observes the viewport again after reattachment', async () => {
    const page = await render(<vertex-viewer-pin-tool />);
    await page.waitForChanges();

    const observe = vi.spyOn(ResizeObserver.prototype, 'observe');
    const parent = page.root.parentElement;

    page.root.remove();
    parent?.appendChild(page.root);
    await page.waitForChanges();

    expect(observe).toHaveBeenCalledWith(page.root);
    observe.mockRestore();
  });

  it('renders a label for a pin', async () => {
    const { root, waitForChanges } = await render(
      <vertex-viewer-pin-tool
        id="vertex-viewer-pin-tool"
        mode="edit"
        tool="pin-text"
      ></vertex-viewer-pin-tool>,
    );
    const toolEl = root as HTMLVertexViewerPinToolElement;
    toolEl.viewer = {
      ...viewer,
      addEventListener,
      frame: {
        scene: {
          camera: {
            projectionViewMatrix: Matrix4.makeIdentity(),
          },
        },
      },
    } as unknown as HTMLVertexViewerElement;
    toolEl.pinController?.addPin(pin);

    await waitForChanges();

    expect(addEventListener).toHaveBeenCalledWith(
      'frameDrawn',
      expect.any(Function),
    );

    const renderer = toolEl.shadowRoot?.querySelector(
      'vertex-viewer-dom-renderer',
    );
    expect(renderer?.drawMode).toBe('2d');

    const group = renderer?.querySelector('#pin-group-my-pin-id');
    if (!group) {
      throw new Error('Expected pin group to render');
    }
    expect(group.hasAttribute('data-is-dom-group-element')).toBe(true);
    expect(
      group.querySelector('[data-testid="drawn-pin-my-pin-id"] #pin-anchor'),
    ).not.toBeNull();
    expect(group.querySelector('#pin-label-line-my-pin-id')).not.toBeNull();
    expect(
      group.querySelector('vertex-viewer-pin-label')?.textContent,
    ).toContain('My New Pin');
  });

  it('should setup the projectionViewMatrix when loading with an initialized viewer', async () => {
    // prettier-ignore
    const matrix = [
      0, 0.5, 0.5, 0,
      0, 1, 0, 0,
      0.5, 0.5, 0, 0,
      0, 0, 0, 1,
    ];

    const { root, waitForChanges } = await render(
      <vertex-viewer-pin-tool
        id="vertex-viewer-pin-tool"
        mode="edit"
        tool="pin-text"
        viewer={
          {
            ...viewer,
            addEventListener,
            getInteractionHandlers: vi.fn().mockResolvedValue([]),
            frame: {
              depthBuffer: vi.fn().mockResolvedValue(undefined),
              scene: {
                camera: {
                  projectionViewMatrix: matrix,
                },
              },
            },
          } as unknown as HTMLVertexViewerElement
        }
      ></vertex-viewer-pin-tool>,
    );
    const toolEl = root as HTMLVertexViewerPinToolElement;

    toolEl.pinController?.addPin(pin);

    await waitForChanges();

    expect(addEventListener).toHaveBeenCalledWith(
      'frameDrawn',
      expect.any(Function),
    );

    expect(
      toolEl.shadowRoot?.querySelector('vertex-viewer-pin-group')
        ?.projectionViewMatrix,
    ).toMatchObject(matrix);
  });

  it('sets the depth buffers value depending if there are pins rendered', async () => {
    const { root, waitForChanges } = await render(
      <vertex-viewer-pin-tool
        id="vertex-viewer-pin-tool"
        mode="edit"
        tool="pin-text"
      ></vertex-viewer-pin-tool>,
    );
    const toolEl = root as HTMLVertexViewerPinToolElement;
    toolEl.viewer = {
      ...viewer,
      addEventListener: vi.fn(),
      frame: {
        scene: {
          camera: {
            projectionViewMatrix: Matrix4.makeIdentity(),
          },
        },
      },
      rotateAroundTapPoint: false,
    } as unknown as HTMLVertexViewerElement;

    expect(toolEl.viewer.depthBuffers).toEqual(undefined);

    // Set depthBuffers to 'final' when there are pins
    toolEl.pinController?.addPin(pin);

    await waitForChanges();

    expect(toolEl.viewer.rotateAroundTapPoint).toEqual(false);
    expect(toolEl.viewer.depthBuffers).toMatch('final');

    // Remove depthBuffers override when there are no pins
    toolEl.pinController?.clearPins();

    await waitForChanges();

    expect(toolEl.viewer.depthBuffers).toEqual(undefined);
  });

  it('sets feature maps, camera controls, and keyboard controls when changing modes', async () => {
    const { root, waitForChanges } = await render(
      <vertex-viewer-pin-tool
        id="vertex-viewer-pin-tool"
        mode="view"
        tool="pin-text"
      ></vertex-viewer-pin-tool>,
    );
    const toolEl = root as HTMLVertexViewerPinToolElement;
    toolEl.viewer = {
      ...viewer,
      addEventListener: vi.fn(),
      frame: {
        scene: {
          camera: {
            projectionViewMatrix: Matrix4.makeIdentity(),
          },
        },
      },
      rotateAroundTapPoint: false,
      cameraControls: true,
      keyboardControls: true,
    } as unknown as HTMLVertexViewerElement;

    expect(toolEl.viewer.featureMaps).toEqual(undefined);
    expect(toolEl.viewer.cameraControls).toEqual(true);
    expect(toolEl.viewer.keyboardControls).toEqual(true);

    // Enter edit mode
    toolEl.mode = 'edit';

    await waitForChanges();

    expect(toolEl.viewer.featureMaps).toEqual('final');
    expect(toolEl.viewer.cameraControls).toEqual(false);
    expect(toolEl.viewer.keyboardControls).toEqual(false);

    // Exit edit mode
    toolEl.mode = 'view';

    await waitForChanges();

    expect(toolEl.viewer.featureMaps).toEqual(undefined);
    expect(toolEl.viewer.cameraControls).toEqual(true);
    expect(toolEl.viewer.keyboardControls).toEqual(true);
  });

  it('does not set feature maps, camera controls, and keyboard controls when exiting edit mode if not overridden', async () => {
    const { root, waitForChanges } = await render(
      <vertex-viewer-pin-tool
        id="vertex-viewer-pin-tool"
        mode="view"
        tool="pin-text"
      ></vertex-viewer-pin-tool>,
    );
    const toolEl = root as HTMLVertexViewerPinToolElement;
    toolEl.viewer = {
      ...viewer,
      addEventListener: vi.fn(),
      frame: {
        scene: {
          camera: {
            projectionViewMatrix: Matrix4.makeIdentity(),
          },
        },
      },
      rotateAroundTapPoint: false,
      featureMaps: 'final',
      cameraControls: false,
      keyboardControls: false,
    } as unknown as HTMLVertexViewerElement;

    expect(toolEl.viewer.featureMaps).toEqual('final');
    expect(toolEl.viewer.cameraControls).toEqual(false);
    expect(toolEl.viewer.keyboardControls).toEqual(false);

    // Enter edit mode
    toolEl.mode = 'edit';

    await waitForChanges();

    expect(toolEl.viewer.featureMaps).toEqual('final');
    expect(toolEl.viewer.cameraControls).toEqual(false);
    expect(toolEl.viewer.keyboardControls).toEqual(false);

    // Exit edit mode
    toolEl.mode = 'view';

    await waitForChanges();

    // Should not change since they were not overridden when entering edit mode
    expect(toolEl.viewer.featureMaps).toEqual('final');
    expect(toolEl.viewer.cameraControls).toEqual(false);
    expect(toolEl.viewer.keyboardControls).toEqual(false);
  });
});
