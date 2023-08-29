jest.mock('../../lib/rendering/imageLoaders');
jest.mock('../../workers/png-decoder-pool');

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';
import { BoundingBox, Vector3 } from '@vertexvis/geometry';

import { ViewerStream } from '../../lib/stream/stream';
import { FrameCamera } from '../../lib/types';
import {
  key1,
  loadViewerStreamKey,
  makeViewerStream,
} from '../../testing/viewer';
import { Viewer } from '../viewer/viewer';
import { ViewerTeleportTool } from './viewer-teleport-tool';

describe('vertex-viewer-teleport-tool', () => {
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
      components: [Viewer, ViewerTeleportTool],
      template: () => (
        <vertex-viewer stream={stream}>
          <vertex-viewer-teleport-tool
            animationsDisabled={true}
            mode="teleport"
          ></vertex-viewer-teleport-tool>
        </vertex-viewer>
      ),
    });

    const viewer = page.root as HTMLVertexViewerElement;
    const streamSpy = jest.spyOn(stream, 'replaceCamera');
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
      'vertex-viewer-teleport-tool'
    ) as HTMLVertexViewerTeleportToolElement;

    tool.controller?.updateConfiguration({ teleportHeightPercentage: 10 });

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
      })
    );
  });

  it('supports the teleport and align interaction', async () => {
    const { stream, ws } = makeViewerStream();
    const page = await newSpecPage({
      components: [Viewer, ViewerTeleportTool],
      template: () => (
        <vertex-viewer stream={stream}>
          <vertex-viewer-teleport-tool
            animationsDisabled={true}
            mode="teleport-and-align"
          ></vertex-viewer-teleport-tool>
        </vertex-viewer>
      ),
    });

    const viewer = page.root as HTMLVertexViewerElement;
    const streamSpy = jest.spyOn(stream, 'replaceCamera');
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
      'vertex-viewer-teleport-tool'
    ) as HTMLVertexViewerTeleportToolElement;

    tool.controller?.updateConfiguration({ teleportHeightPercentage: 10 });

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
      })
    );
  });

  it('supports animations', async () => {
    const { stream, ws } = makeViewerStream();
    const page = await newSpecPage({
      components: [Viewer, ViewerTeleportTool],
      template: () => (
        <vertex-viewer stream={stream}>
          <vertex-viewer-teleport-tool mode="teleport"></vertex-viewer-teleport-tool>
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
      'vertex-viewer-teleport-tool'
    ) as HTMLVertexViewerTeleportToolElement;

    tool.controller?.updateConfiguration({ teleportHeightPercentage: 10 });

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

  it('supports changing animation properties', async () => {
    const { stream, ws } = makeViewerStream();
    const page = await newSpecPage({
      components: [Viewer, ViewerTeleportTool],
      template: () => (
        <vertex-viewer stream={stream}>
          <vertex-viewer-teleport-tool mode="teleport"></vertex-viewer-teleport-tool>
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
      'vertex-viewer-teleport-tool'
    ) as HTMLVertexViewerTeleportToolElement;

    tool.controller?.updateConfiguration({ teleportHeightPercentage: 10 });
    tool.animationsDisabled = false;
    tool.animationMs = 10000;

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
        animation: expect.objectContaining({
          duration: expect.objectContaining({
            seconds: 10,
          }),
        }),
      }),
      true
    );
  });
});
