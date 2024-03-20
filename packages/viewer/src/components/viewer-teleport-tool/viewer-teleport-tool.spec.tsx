jest.mock('../../lib/rendering/imageLoaders');
jest.mock('../../workers/png-decoder-pool');

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';
import { BoundingBox, Point, Ray, Vector3 } from '@vertexvis/geometry';

import { ViewerStream } from '../../lib/stream/stream';
import {
  FrameCamera,
  FrameImage,
  FramePerspectiveCamera,
  Viewport,
} from '../../lib/types';
import { drawFramePayloadPerspective } from '../../testing/fixtures';
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
  function mockHitInteraction(stream: ViewerStream, hit = mockHit): void {
    jest.spyOn(stream, 'beginInteraction').mockResolvedValueOnce({
      beginInteraction: {},
    });
    jest.spyOn(stream, 'hitItems').mockResolvedValueOnce({
      hitItems: {
        hits: [hit],
      },
    });
    jest.spyOn(stream, 'endInteraction').mockResolvedValueOnce({
      endInteraction: {},
    });
  }

  function mockViewport(viewer: HTMLVertexViewerElement, hit = mockHit): void {
    const viewport = new Viewport(
      drawFramePayloadPerspective.imageAttributes?.frameDimensions
        ?.width as number,
      drawFramePayloadPerspective.imageAttributes?.frameDimensions
        ?.height as number
    );

    jest
      .spyOn(viewport, 'transformPointToWorldSpace')
      .mockReturnValue(hit.hitPoint);

    viewer.viewport = viewport;
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

    mockViewport(viewer);

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
    mockHitInteraction(stream, { ...mockHit, hitNormal: Vector3.right() });

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
            x: height,
            y: 0,
            z: mockHit.hitPoint.z,
          },
          lookAt: {
            x: height,
            y: 0,
            z: mockHit.hitPoint.z - viewVectorDistance,
          },
        }),
      })
    );
  });

  it('supports the teleport toward interaction', async () => {
    const { stream, ws } = makeViewerStream();
    const page = await newSpecPage({
      components: [Viewer, ViewerTeleportTool],
      template: () => (
        <vertex-viewer stream={stream}>
          <vertex-viewer-teleport-tool
            animationsDisabled={true}
            mode="teleport-toward"
          ></vertex-viewer-teleport-tool>
        </vertex-viewer>
      ),
    });

    const viewer = page.root as HTMLVertexViewerElement;
    const streamSpy = jest.spyOn(stream, 'replaceCamera');
    mockHitInteraction(stream, { ...mockHit, hitNormal: Vector3.right() });

    await loadViewerStreamKey(key1, { viewer, stream, ws });

    mockViewport(viewer);

    const camera = viewer.frame?.scene
      .camera as FrameCamera.PerspectiveFrameCamera;
    const boundingBox = viewer.frame?.scene
      .boundingBox as BoundingBox.BoundingBox;
    const maxLength = Math.max(
      ...Vector3.toArray(BoundingBox.lengths(boundingBox))
    );

    const canvas = viewer.shadowRoot?.querySelector(
      'canvas'
    ) as HTMLCanvasElement;
    const tool = viewer.querySelector(
      'vertex-viewer-teleport-tool'
    ) as HTMLVertexViewerTeleportToolElement;

    tool.controller?.updateConfiguration({ teleportDistancePercentage: 1 });

    await page.waitForChanges();

    canvas.dispatchEvent(
      new MouseEvent('pointerdown', { clientX: 50, clientY: 25 })
    );
    window.dispatchEvent(
      new MouseEvent('pointerup', { clientX: 50, clientY: 25 })
    );

    await page.waitForChanges();

    const distance = maxLength * 0.01;

    expect(streamSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        camera: expect.objectContaining({
          position: {
            x: 0,
            y: 0,
            z: camera.position.z - distance,
          },
          lookAt: {
            x: 0,
            y: 0,
            z: camera.lookAt.z - distance,
          },
        }),
      })
    );
  });

  it('teleports toward the mouse position', async () => {
    const { stream, ws } = makeViewerStream();
    const page = await newSpecPage({
      components: [Viewer, ViewerTeleportTool],
      template: () => (
        <vertex-viewer stream={stream}>
          <vertex-viewer-teleport-tool
            animationsDisabled={true}
            mode="teleport-toward"
          ></vertex-viewer-teleport-tool>
        </vertex-viewer>
      ),
    });

    const viewer = page.root as HTMLVertexViewerElement;
    const streamSpy = jest.spyOn(stream, 'replaceCamera');
    mockHitInteraction(stream, { ...mockHit, hitNormal: Vector3.right() });

    await loadViewerStreamKey(key1, { viewer, stream, ws });

    mockViewport(viewer);

    const camera = viewer.frame?.scene.camera as FramePerspectiveCamera;
    const boundingBox = viewer.frame?.scene
      .boundingBox as BoundingBox.BoundingBox;
    const maxLength = Math.max(
      ...Vector3.toArray(BoundingBox.lengths(boundingBox))
    );

    const canvas = viewer.shadowRoot?.querySelector(
      'canvas'
    ) as HTMLCanvasElement;
    const tool = viewer.querySelector(
      'vertex-viewer-teleport-tool'
    ) as HTMLVertexViewerTeleportToolElement;

    tool.controller?.updateConfiguration({ teleportDistancePercentage: 1 });

    await page.waitForChanges();

    canvas.dispatchEvent(
      new MouseEvent('pointerdown', { clientX: 75, clientY: 25 })
    );
    window.dispatchEvent(
      new MouseEvent('pointerup', { clientX: 75, clientY: 25 })
    );

    await page.waitForChanges();

    const distance = maxLength * 0.01;
    const ray = viewer.viewport.transformPointToRay(
      Point.create(75, 25),
      viewer.frame?.image as FrameImage,
      camera
    );
    const position = Ray.at(ray, distance);
    const lookAt = Vector3.create(
      camera.lookAt.x + (position.x - camera.position.x),
      0,
      camera.lookAt.z + (position.z - camera.position.z)
    );

    expect(streamSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        camera: expect.objectContaining({
          position,
          lookAt,
        }),
      })
    );
  });

  it('handles collision', async () => {
    const collisionDistance = 10;
    const { stream, ws } = makeViewerStream();
    const page = await newSpecPage({
      components: [Viewer, ViewerTeleportTool],
      template: () => (
        <vertex-viewer stream={stream}>
          <vertex-viewer-teleport-tool
            animationsDisabled={true}
            mode="teleport-toward"
          ></vertex-viewer-teleport-tool>
        </vertex-viewer>
      ),
    });

    const viewer = page.root as HTMLVertexViewerElement;
    const streamSpy = jest.spyOn(stream, 'replaceCamera');
    mockHitInteraction(stream, { ...mockHit, hitNormal: Vector3.right() });

    await loadViewerStreamKey(key1, { viewer, stream, ws });

    const camera = viewer.frame?.scene.camera as FramePerspectiveCamera;
    const canvas = viewer.shadowRoot?.querySelector(
      'canvas'
    ) as HTMLCanvasElement;
    const tool = viewer.querySelector(
      'vertex-viewer-teleport-tool'
    ) as HTMLVertexViewerTeleportToolElement;

    tool.controller?.updateConfiguration({
      teleportDistancePercentage: 10,
      teleportCollisionDistance: collisionDistance,
    });

    const hitPoint = Vector3.create(
      0,
      0,
      camera.position.z - collisionDistance * 1.5
    );
    mockViewport(viewer, {
      ...mockHit,
      hitPoint,
    });

    await page.waitForChanges();

    canvas.dispatchEvent(
      new MouseEvent('pointerdown', { clientX: 50, clientY: 25 })
    );
    window.dispatchEvent(
      new MouseEvent('pointerup', { clientX: 50, clientY: 25 })
    );

    await page.waitForChanges();

    expect(streamSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        camera: expect.objectContaining({
          position: {
            x: 0,
            y: 0,
            z: hitPoint.z + collisionDistance,
          },
          lookAt: {
            x: 0,
            y: 0,
            z:
              camera.lookAt.z +
              (hitPoint.z + collisionDistance - camera.position.z),
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

    mockViewport(viewer);

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

    mockViewport(viewer);

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
