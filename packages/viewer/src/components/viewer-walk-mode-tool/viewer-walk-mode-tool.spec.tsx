jest.mock('../../lib/rendering/imageLoaders');
jest.mock('../../workers/png-decoder-pool');
jest.mock('../../lib/walk-mode/dom', () => ({
  targetIsElement: jest.fn(() => true),
}));

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';
import { BoundingBox, Vector3 } from '@vertexvis/geometry';

import { ViewerStream } from '../../lib/stream/stream';
import { FrameCamera } from '../../lib/types';
import { ViewerWalkModeOperation } from '../../lib/walk-mode/model';
import {
  key1,
  loadViewerStreamKey,
  makeViewerStream,
} from '../../testing/viewer';
import { Viewer } from '../viewer/viewer';
import { ViewerTeleportTool } from '../viewer-teleport-tool/viewer-teleport-tool';
import { ViewerWalkModeTool } from './viewer-walk-mode-tool';

describe('vertex-viewer-walk-mode-tool', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockHit = {
    hitPoint: Vector3.create(0, 0, -100),
    hitNormal: Vector3.up(),
  };

  function mockHitInteraction(stream: ViewerStream): void {
    jest.spyOn(stream, 'beginInteraction').mockResolvedValueOnce({
      beginInteraction: {},
    });
    jest.spyOn(stream, 'hitItems').mockResolvedValueOnce({
      hitItems: {
        hits: [mockHit],
      },
    });
    jest.spyOn(stream, 'endInteraction').mockResolvedValueOnce({
      endInteraction: {},
    });
  }

  it('supports the teleport interaction', async () => {
    const { stream, ws } = makeViewerStream();
    const page = await newSpecPage({
      components: [Viewer, ViewerWalkModeTool, ViewerTeleportTool],
      template: () => (
        <vertex-viewer stream={stream}>
          <vertex-viewer-walk-mode-tool teleportMode="teleport"></vertex-viewer-walk-mode-tool>
        </vertex-viewer>
      ),
    });

    const viewer = page.root as HTMLVertexViewerElement;
    const streamSpy = jest.spyOn(stream, 'flyTo');
    mockHitInteraction(stream);

    await loadViewerStreamKey(key1, { viewer, stream, ws });

    const camera = viewer.frame?.scene
      .camera as FrameCamera.PerspectiveFrameCamera;
    const viewVectorDistance = Vector3.distance(camera.position, camera.lookAt);
    const boundingBox = viewer.frame?.scene
      .boundingBox as BoundingBox.BoundingBox;
    const minLength = Math.min(
      ...Vector3.toArray(BoundingBox.lengths(boundingBox))
    );

    const canvas = viewer.shadowRoot?.querySelector(
      'canvas'
    ) as HTMLCanvasElement;
    const tool = viewer.querySelector(
      'vertex-viewer-walk-mode-tool'
    ) as HTMLVertexViewerWalkModeToolElement;

    tool.controller?.updateConfiguration({ teleportHeightScalar: 10 });

    await page.waitForChanges();

    canvas.dispatchEvent(new MouseEvent('pointerdown'));
    window.dispatchEvent(new MouseEvent('pointerup'));

    await page.waitForChanges();

    const expectedPositionZ = mockHit.hitPoint.z + minLength / 10;

    expect(streamSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        camera: expect.objectContaining({
          position: {
            x: 0,
            y: 0,
            z: expectedPositionZ,
          },
          lookAt: {
            x: 0,
            y: 0,
            z: expectedPositionZ - viewVectorDistance,
          },
        }),
      }),
      true
    );
  });

  it('supports the teleport and align interaction', async () => {
    const { stream, ws } = makeViewerStream();
    const page = await newSpecPage({
      components: [Viewer, ViewerWalkModeTool, ViewerTeleportTool],
      template: () => (
        <vertex-viewer stream={stream}>
          <vertex-viewer-walk-mode-tool teleportMode="teleport-and-align"></vertex-viewer-walk-mode-tool>
        </vertex-viewer>
      ),
    });

    const viewer = page.root as HTMLVertexViewerElement;
    const streamSpy = jest.spyOn(stream, 'flyTo');
    mockHitInteraction(stream);

    await loadViewerStreamKey(key1, { viewer, stream, ws });

    const camera = viewer.frame?.scene
      .camera as FrameCamera.PerspectiveFrameCamera;
    const viewVectorDistance = Vector3.distance(camera.position, camera.lookAt);
    const boundingBox = viewer.frame?.scene
      .boundingBox as BoundingBox.BoundingBox;
    const minLength = Math.min(
      ...Vector3.toArray(BoundingBox.lengths(boundingBox))
    );

    const canvas = viewer.shadowRoot?.querySelector(
      'canvas'
    ) as HTMLCanvasElement;
    const tool = viewer.querySelector(
      'vertex-viewer-walk-mode-tool'
    ) as HTMLVertexViewerWalkModeToolElement;

    tool.controller?.updateConfiguration({ teleportHeightScalar: 10 });

    await page.waitForChanges();

    canvas.dispatchEvent(new MouseEvent('pointerdown'));
    window.dispatchEvent(new MouseEvent('pointerup'));

    await page.waitForChanges();

    const height = minLength / 10;

    expect(streamSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        camera: expect.objectContaining({
          position: {
            x: 0,
            y: height,
            z: mockHit.hitPoint.z,
          },
          lookAt: {
            x: 0,
            y: height,
            z: mockHit.hitPoint.z - viewVectorDistance,
          },
        }),
      }),
      true
    );
  });

  it('supports keyboard walk movement', async () => {
    const { stream, ws } = makeViewerStream();
    const page = await newSpecPage({
      components: [Viewer, ViewerWalkModeTool, ViewerTeleportTool],
      template: () => (
        <vertex-viewer stream={stream}>
          <vertex-viewer-walk-mode-tool teleportMode="teleport"></vertex-viewer-walk-mode-tool>
        </vertex-viewer>
      ),
    });

    const viewer = page.root as HTMLVertexViewerElement;
    const streamSpy = jest.spyOn(stream, 'replaceCamera');
    mockHitInteraction(stream);

    await loadViewerStreamKey(key1, { viewer, stream, ws });

    const camera = viewer.frame?.scene
      .camera as FrameCamera.PerspectiveFrameCamera;
    const boundingBox = viewer.frame?.scene
      .boundingBox as BoundingBox.BoundingBox;
    const minLength = Math.min(
      ...Vector3.toArray(BoundingBox.lengths(boundingBox))
    );

    await page.waitForChanges();

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
    await new Promise((resolve) => setTimeout(resolve, 25));
    window.dispatchEvent(new KeyboardEvent('keyup', { key: 'w' }));
    window.dispatchEvent(new KeyboardEvent('keyup', { key: 'a' }));

    await page.waitForChanges();

    const stepDistance = minLength / 100;

    expect(streamSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        camera: expect.objectContaining({
          position: {
            x: -stepDistance,
            y: 0,
            z: camera.position.z - stepDistance,
          },
          lookAt: {
            x: -stepDistance,
            y: 0,
            z: camera.lookAt.z - stepDistance,
          },
        }),
      })
    );

    streamSpy.mockClear();

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 's' }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd' }));
    await new Promise((resolve) => setTimeout(resolve, 25));
    window.dispatchEvent(new KeyboardEvent('keyup', { key: 's' }));
    window.dispatchEvent(new KeyboardEvent('keyup', { key: 'd' }));

    await page.waitForChanges();

    expect(streamSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        camera: expect.objectContaining({
          position: {
            x: 0,
            y: 0,
            z: camera.position.z + stepDistance,
          },
          lookAt: {
            x: 0,
            y: 0,
            z: camera.lookAt.z + stepDistance,
          },
        }),
      })
    );
  });

  it('supports keyboard pivot movement', async () => {
    const { stream, ws } = makeViewerStream();
    const page = await newSpecPage({
      components: [Viewer, ViewerWalkModeTool, ViewerTeleportTool],
      template: () => (
        <vertex-viewer stream={stream}>
          <vertex-viewer-walk-mode-tool teleportMode="teleport"></vertex-viewer-walk-mode-tool>
        </vertex-viewer>
      ),
    });

    const viewer = page.root as HTMLVertexViewerElement;
    const streamSpy = jest.spyOn(stream, 'replaceCamera');
    mockHitInteraction(stream);

    await loadViewerStreamKey(key1, { viewer, stream, ws });

    await page.waitForChanges();

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    await new Promise((resolve) => setTimeout(resolve, 25));
    window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowUp' }));
    window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowLeft' }));

    await page.waitForChanges();

    const upLeftCall = streamSpy.mock.calls[1][0];

    expect(upLeftCall.camera.lookAt.x).toBeCloseTo(-1.745);
    expect(upLeftCall.camera.lookAt.y).toBeCloseTo(1.745);
    expect(upLeftCall.camera.lookAt.z).toBeCloseTo(0.03);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    await new Promise((resolve) => setTimeout(resolve, 25));
    window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowDown' }));
    window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowRight' }));

    await page.waitForChanges();

    const downRightCall = streamSpy.mock.calls[3][0];

    expect(downRightCall.camera.lookAt.x).toBeCloseTo(1.745);
    expect(downRightCall.camera.lookAt.y).toBeCloseTo(-1.745);
    expect(downRightCall.camera.lookAt.z).toBeCloseTo(0.03);
  });

  it('supports keyboard vertical movement', async () => {
    const { stream, ws } = makeViewerStream();
    const page = await newSpecPage({
      components: [Viewer, ViewerWalkModeTool, ViewerTeleportTool],
      template: () => (
        <vertex-viewer stream={stream}>
          <vertex-viewer-walk-mode-tool teleportMode="teleport"></vertex-viewer-walk-mode-tool>
        </vertex-viewer>
      ),
    });

    const viewer = page.root as HTMLVertexViewerElement;
    const streamSpy = jest.spyOn(stream, 'replaceCamera');
    mockHitInteraction(stream);

    await loadViewerStreamKey(key1, { viewer, stream, ws });

    const camera = viewer.frame?.scene
      .camera as FrameCamera.PerspectiveFrameCamera;
    const boundingBox = viewer.frame?.scene
      .boundingBox as BoundingBox.BoundingBox;
    const minLength = Math.min(
      ...Vector3.toArray(BoundingBox.lengths(boundingBox))
    );

    await page.waitForChanges();

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageUp' }));
    await new Promise((resolve) => setTimeout(resolve, 25));
    window.dispatchEvent(new KeyboardEvent('keyup', { key: 'PageUp' }));

    await page.waitForChanges();

    const stepDistance = minLength / 100;

    expect(streamSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        camera: expect.objectContaining({
          position: {
            x: 0,
            y: stepDistance,
            z: camera.position.z,
          },
          lookAt: {
            x: 0,
            y: stepDistance,
            z: camera.lookAt.z,
          },
        }),
      })
    );

    streamSpy.mockClear();

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageDown' }));
    await new Promise((resolve) => setTimeout(resolve, 25));
    window.dispatchEvent(new KeyboardEvent('keyup', { key: 'PageDown' }));

    expect(streamSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        camera: expect.objectContaining({
          position: {
            x: 0,
            y: -stepDistance,
            z: camera.position.z,
          },
          lookAt: {
            x: 0,
            y: -stepDistance,
            z: camera.lookAt.z,
          },
        }),
      })
    );
  });

  it('supports a custom teleport tool', async () => {
    const { stream, ws } = makeViewerStream();
    const page = await newSpecPage({
      components: [Viewer, ViewerWalkModeTool, ViewerTeleportTool],
      template: () => (
        <vertex-viewer stream={stream}>
          <vertex-viewer-walk-mode-tool teleportMode="teleport">
            <vertex-viewer-teleport-tool
              slot="teleport-tool"
              animationMs={5000}
            ></vertex-viewer-teleport-tool>
          </vertex-viewer-walk-mode-tool>
        </vertex-viewer>
      ),
    });

    const viewer = page.root as HTMLVertexViewerElement;
    const streamSpy = jest.spyOn(stream, 'flyTo');
    mockHitInteraction(stream);

    await loadViewerStreamKey(key1, { viewer, stream, ws });

    const canvas = viewer.shadowRoot?.querySelector(
      'canvas'
    ) as HTMLCanvasElement;
    const tool = viewer.querySelector(
      'vertex-viewer-walk-mode-tool'
    ) as HTMLVertexViewerWalkModeToolElement;

    tool.controller?.updateConfiguration({ teleportHeightScalar: 10 });

    await page.waitForChanges();

    canvas.dispatchEvent(new MouseEvent('pointerdown'));
    window.dispatchEvent(new MouseEvent('pointerup'));

    await page.waitForChanges();

    expect(streamSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        animation: expect.objectContaining({
          duration: expect.objectContaining({
            seconds: 5,
          }),
        }),
      }),
      true
    );
  });

  it('supports adding custom keybindings', async () => {
    const { stream, ws } = makeViewerStream();
    const page = await newSpecPage({
      components: [Viewer, ViewerWalkModeTool, ViewerTeleportTool],
      template: () => (
        <vertex-viewer stream={stream}>
          <vertex-viewer-walk-mode-tool teleportMode="teleport">
            <vertex-viewer-teleport-tool
              slot="teleport-tool"
              animationMs={5000}
            ></vertex-viewer-teleport-tool>
          </vertex-viewer-walk-mode-tool>
        </vertex-viewer>
      ),
    });

    const viewer = page.root as HTMLVertexViewerElement;
    const streamSpy = jest.spyOn(stream, 'replaceCamera');
    mockHitInteraction(stream);

    await loadViewerStreamKey(key1, { viewer, stream, ws });

    const camera = viewer.frame?.scene
      .camera as FrameCamera.PerspectiveFrameCamera;
    const boundingBox = viewer.frame?.scene
      .boundingBox as BoundingBox.BoundingBox;
    const minLength = Math.min(
      ...Vector3.toArray(BoundingBox.lengths(boundingBox))
    );

    const tool = viewer.querySelector(
      'vertex-viewer-walk-mode-tool'
    ) as HTMLVertexViewerWalkModeToolElement;

    tool.controller?.updateConfiguration({ teleportHeightScalar: 10 });
    tool.controller?.addKeyBinding(ViewerWalkModeOperation.WALK_FORWARD, '1');

    await page.waitForChanges();

    window.dispatchEvent(new KeyboardEvent('keydown', { key: '1' }));
    await new Promise((resolve) => setTimeout(resolve, 25));
    window.dispatchEvent(new KeyboardEvent('keyup', { key: '1' }));

    await page.waitForChanges();

    const stepDistance = minLength / 100;

    expect(streamSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        camera: expect.objectContaining({
          position: {
            x: 0,
            y: 0,
            z: camera.position.z - stepDistance,
          },
          lookAt: {
            x: 0,
            y: 0,
            z: camera.lookAt.z - stepDistance,
          },
        }),
      })
    );

    streamSpy.mockClear();

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }));
    await new Promise((resolve) => setTimeout(resolve, 25));
    window.dispatchEvent(new KeyboardEvent('keyup', { key: 'w' }));

    await page.waitForChanges();

    expect(streamSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        camera: expect.objectContaining({
          position: {
            x: 0,
            y: 0,
            z: camera.position.z - stepDistance,
          },
          lookAt: {
            x: 0,
            y: 0,
            z: camera.lookAt.z - stepDistance,
          },
        }),
      })
    );
  });

  it('supports overriding custom keybindings', async () => {
    const { stream, ws } = makeViewerStream();
    const page = await newSpecPage({
      components: [Viewer, ViewerWalkModeTool, ViewerTeleportTool],
      template: () => (
        <vertex-viewer stream={stream}>
          <vertex-viewer-walk-mode-tool teleportMode="teleport">
            <vertex-viewer-teleport-tool
              slot="teleport-tool"
              animationMs={5000}
            ></vertex-viewer-teleport-tool>
          </vertex-viewer-walk-mode-tool>
        </vertex-viewer>
      ),
    });

    const viewer = page.root as HTMLVertexViewerElement;
    const streamSpy = jest.spyOn(stream, 'replaceCamera');
    mockHitInteraction(stream);

    await loadViewerStreamKey(key1, { viewer, stream, ws });

    const camera = viewer.frame?.scene
      .camera as FrameCamera.PerspectiveFrameCamera;
    const boundingBox = viewer.frame?.scene
      .boundingBox as BoundingBox.BoundingBox;
    const minLength = Math.min(
      ...Vector3.toArray(BoundingBox.lengths(boundingBox))
    );

    const tool = viewer.querySelector(
      'vertex-viewer-walk-mode-tool'
    ) as HTMLVertexViewerWalkModeToolElement;

    tool.controller?.updateConfiguration({ teleportHeightScalar: 10 });
    tool.controller?.replaceKeyBinding(
      ViewerWalkModeOperation.WALK_FORWARD,
      '1'
    );

    await page.waitForChanges();

    window.dispatchEvent(new KeyboardEvent('keydown', { key: '1' }));
    await new Promise((resolve) => setTimeout(resolve, 25));
    window.dispatchEvent(new KeyboardEvent('keyup', { key: '1' }));

    await page.waitForChanges();

    const stepDistance = minLength / 100;

    expect(streamSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        camera: expect.objectContaining({
          position: {
            x: 0,
            y: 0,
            z: camera.position.z - stepDistance,
          },
          lookAt: {
            x: 0,
            y: 0,
            z: camera.lookAt.z - stepDistance,
          },
        }),
      })
    );

    streamSpy.mockClear();

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }));
    await new Promise((resolve) => setTimeout(resolve, 25));
    window.dispatchEvent(new KeyboardEvent('keyup', { key: 'w' }));

    await page.waitForChanges();

    expect(streamSpy).not.toHaveBeenCalled();
  });

  it('excludes input elements', async () => {
    const { stream, ws } = makeViewerStream();
    const page = await newSpecPage({
      components: [Viewer, ViewerWalkModeTool, ViewerTeleportTool],
      template: () => (
        <vertex-viewer stream={stream}>
          <input></input>
          <vertex-viewer-walk-mode-tool teleportMode="teleport">
            <vertex-viewer-teleport-tool
              slot="teleport-tool"
              animationMs={5000}
            ></vertex-viewer-teleport-tool>
          </vertex-viewer-walk-mode-tool>
        </vertex-viewer>
      ),
    });

    const viewer = page.root as HTMLVertexViewerElement;
    const streamSpy = jest.spyOn(stream, 'replaceCamera');
    mockHitInteraction(stream);

    await loadViewerStreamKey(key1, { viewer, stream, ws });

    const input = viewer.querySelector('input') as HTMLInputElement;

    await page.waitForChanges();

    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'w', bubbles: true })
    );
    await new Promise((resolve) => setTimeout(resolve, 25));
    input.dispatchEvent(
      new KeyboardEvent('keyup', { key: 'w', bubbles: true })
    );

    await page.waitForChanges();

    expect(streamSpy).not.toHaveBeenCalled();
  });

  it('supports excluding custom elements by tag name', async () => {
    const { stream, ws } = makeViewerStream();
    const page = await newSpecPage({
      components: [Viewer, ViewerWalkModeTool, ViewerTeleportTool],
      template: () => (
        <vertex-viewer stream={stream}>
          <div></div>
          <vertex-viewer-walk-mode-tool teleportMode="teleport">
            <vertex-viewer-teleport-tool
              slot="teleport-tool"
              animationMs={5000}
            ></vertex-viewer-teleport-tool>
          </vertex-viewer-walk-mode-tool>
        </vertex-viewer>
      ),
    });

    const viewer = page.root as HTMLVertexViewerElement;
    const streamSpy = jest.spyOn(stream, 'replaceCamera');
    mockHitInteraction(stream);

    await loadViewerStreamKey(key1, { viewer, stream, ws });

    const tool = viewer.querySelector(
      'vertex-viewer-walk-mode-tool'
    ) as HTMLVertexViewerWalkModeToolElement;

    const div = viewer.querySelector('div') as HTMLDivElement;

    tool.controller?.excludeElement('DIV');

    await page.waitForChanges();

    div.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'w', bubbles: true })
    );
    await new Promise((resolve) => setTimeout(resolve, 25));
    div.dispatchEvent(new KeyboardEvent('keyup', { key: 'w', bubbles: true }));

    await page.waitForChanges();

    expect(streamSpy).not.toHaveBeenCalled();
  });

  it('supports excluding custom elements by predicate', async () => {
    const { stream, ws } = makeViewerStream();
    const page = await newSpecPage({
      components: [Viewer, ViewerWalkModeTool, ViewerTeleportTool],
      template: () => (
        <vertex-viewer stream={stream}>
          <div id="ignored"></div>
          <div id="standard"></div>
          <vertex-viewer-walk-mode-tool teleportMode="teleport">
            <vertex-viewer-teleport-tool
              slot="teleport-tool"
              animationMs={5000}
            ></vertex-viewer-teleport-tool>
          </vertex-viewer-walk-mode-tool>
        </vertex-viewer>
      ),
    });

    const viewer = page.root as HTMLVertexViewerElement;
    const streamSpy = jest.spyOn(stream, 'replaceCamera');
    mockHitInteraction(stream);

    await loadViewerStreamKey(key1, { viewer, stream, ws });

    const tool = viewer.querySelector(
      'vertex-viewer-walk-mode-tool'
    ) as HTMLVertexViewerWalkModeToolElement;

    const ignored = viewer.querySelector('#ignored') as HTMLDivElement;
    const standard = viewer.querySelector('#standard') as HTMLDivElement;

    tool.controller?.excludeElement((el) => el.id === 'ignored');

    await page.waitForChanges();

    ignored.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'w', bubbles: true })
    );
    await new Promise((resolve) => setTimeout(resolve, 25));
    ignored.dispatchEvent(
      new KeyboardEvent('keyup', { key: 'w', bubbles: true })
    );

    await page.waitForChanges();

    expect(streamSpy).not.toHaveBeenCalled();

    standard.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'w', bubbles: true })
    );
    await new Promise((resolve) => setTimeout(resolve, 25));
    standard.dispatchEvent(
      new KeyboardEvent('keyup', { key: 'w', bubbles: true })
    );

    await page.waitForChanges();

    expect(streamSpy).toHaveBeenCalled();
  });
});
