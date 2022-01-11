jest.mock('./utils');
jest.mock('../../lib/rendering/imageLoaders');
jest.mock('../../workers/png-decoder-pool');

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h } from '@stencil/core';
import { NewSpecPageOptions } from '@stencil/core/internal';
import { newSpecPage } from '@stencil/core/testing';
import { Async, Color } from '@vertexvis/utils';

import { MouseInteractionHandler } from '../../lib/interactions/mouseInteractionHandler';
import { TouchInteractionHandler } from '../../lib/interactions/touchInteractionHandler';
import { loadImageBytes } from '../../lib/rendering/imageLoaders';
import * as Storage from '../../lib/storage';
import { random } from '../../testing';
import {
  key1,
  key2,
  loadViewerStreamKey,
  makeViewerStream,
} from '../../testing/viewer';
import {
  getElementBackgroundColor,
  getElementBoundingClientRect,
} from './utils';
import { Viewer } from './viewer';

describe('vertex-viewer', () => {
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

  const clientId = random.string({ alpha: true });
  const token = random.string({ alpha: true });

  const screenPos0 = { screenX: 0, screenY: 0 };
  const screenPos50 = { screenX: 50, screenY: 50 };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('config', () => {
    it('defaults to production', async () => {
      const viewer = await newViewerSpec({ template: () => <vertex-viewer /> });

      expect(viewer.resolvedConfig).toMatchObject({
        network: {
          apiHost: 'https://platform.platprod.vertexvis.io',
          renderingHost: 'wss://stream.platprod.vertexvis.io',
        },
      });
    });

    it('allows for platdev via the config route', async () => {
      const viewer = await newViewerSpec({ template: () => <vertex-viewer /> });
      viewer.configEnv = 'platdev';
      expect(viewer.resolvedConfig).toMatchObject({
        network: {
          apiHost: 'https://platform.platdev.vertexvis.io',
          renderingHost: 'wss://stream.platdev.vertexvis.io',
        },
      });
    });
  });

  describe('when camera-controls prop is not set', () => {
    it('registers camera and touch interaction handlers by default', async () => {
      const viewer = await newViewerSpec({ template: () => <vertex-viewer /> });
      const handlers = await viewer.getInteractionHandlers();

      expect(handlers).toEqual(
        expect.arrayContaining([
          expect.any(MouseInteractionHandler),
          expect.any(TouchInteractionHandler),
        ])
      );
    });
  });

  describe('when camera-controls prop is false', () => {
    it('does not register camera and touch interaction handlers', async () => {
      const viewer = await newViewerSpec({
        template: () => <vertex-viewer cameraControls={false} />,
      });
      const handlers = await viewer.getInteractionHandlers();

      expect(handlers).not.toEqual(
        expect.arrayContaining([
          expect.any(MouseInteractionHandler),
          expect.any(TouchInteractionHandler),
        ])
      );
    });
  });

  describe(Viewer.prototype.registerInteractionHandler, () => {
    const handler = {
      dispose: jest.fn(),
      initialize: jest.fn(),
    };

    it('initializes interaction handler', async () => {
      const viewer = await newViewerSpec({
        template: () => <vertex-viewer cameraControls={false} />,
      });

      await viewer.registerInteractionHandler(handler);
      expect(handler.initialize).toHaveBeenCalled();
    });

    it('disposing registered interaction handler removes handler', async () => {
      const viewer = await newViewerSpec({
        template: () => (
          <vertex-viewer cameraControls={false} keyboardControls={false} />
        ),
      });

      const disposable = await viewer.registerInteractionHandler(handler);
      disposable.dispose();
      expect(handler.dispose).toHaveBeenCalled();

      const handlers = await viewer.getInteractionHandlers();
      expect(handlers).toHaveLength(0);
    });
  });

  describe(Viewer.prototype.load, () => {
    it('emits connection, frame and scene events', async () => {
      const { stream, ws } = makeViewerStream();
      const viewer = await newViewerSpec({
        template: () => <vertex-viewer clientId={clientId} stream={stream} />,
      });

      const onConnectionChange = jest.fn();
      const onSceneReady = jest.fn();
      const onFrameReceived = jest.fn();
      const onFrameDrawn = jest.fn();

      viewer.addEventListener('connectionChange', onConnectionChange);
      viewer.addEventListener('sceneReady', onSceneReady);
      viewer.addEventListener('frameReceived', onFrameReceived);
      viewer.addEventListener('frameDrawn', onFrameDrawn);
      await loadViewerStreamKey(key1, { viewer, stream, ws }, { token });

      expect(onConnectionChange).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: { status: 'connecting' },
        })
      );
      expect(onConnectionChange).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: { status: 'connected', jwt: token },
        })
      );
      expect(onSceneReady).toHaveBeenCalled();
      expect(onFrameReceived).toHaveBeenCalled();
      expect(onFrameDrawn).toHaveBeenCalled();

      expect(viewer.token).toBe(token);
      expect(viewer.frame).toBeDefined();
    });

    it('loads different stream key', async () => {
      const { stream, ws } = makeViewerStream();
      const viewer = await newViewerSpec({
        template: () => <vertex-viewer clientId={clientId} stream={stream} />,
      });

      const onSceneReady = jest.fn();
      viewer.addEventListener('sceneReady', onSceneReady);

      await loadViewerStreamKey(key1, { viewer, stream, ws }, { token });
      expect(onSceneReady).toHaveBeenCalled();
      expect(viewer.token).toBe(token);
      onSceneReady.mockClear();

      const token2 = random.string();
      await loadViewerStreamKey(
        key2,
        { viewer, stream, ws },
        { token: token2 }
      );
      expect(onSceneReady).toHaveBeenCalled();
      expect(viewer.token).toBe(token2);
    });

    it('loads stream with correct stream attributes', async () => {
      (getElementBackgroundColor as jest.Mock).mockReturnValue(
        Color.fromHexString('#0000ff')
      );

      const { stream, ws } = makeViewerStream();
      const viewer = await newViewerSpec({
        template: () => (
          <vertex-viewer
            clientId={clientId}
            stream={stream}
            experimentalGhostingOpacity={1}
            featureLines={{ width: 1 }}
            featureHighlighting={{ highlightColor: 0xff0000 }}
            depthBuffers="all"
            featureMaps="all"
          />
        ),
      });

      const update = jest.spyOn(stream, 'update');
      await loadViewerStreamKey(key1, { viewer, stream, ws });

      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({
          frameBgColor: expect.objectContaining({ r: 0, g: 0, b: 255 }),
          streamAttributes: expect.objectContaining({
            depthBuffers: 'all',
            experimentalGhosting: 1,
            featureLines: { width: 1 },
            featureHighlighting: { highlightColor: 0xff0000 },
            featureMaps: 'all',
          }),
          dimensions: { width: 200, height: 150 },
        })
      );
    });
  });

  describe(Viewer.prototype.unload, () => {
    it('disconnects the WS', async () => {
      const { stream, ws } = makeViewerStream();
      const viewer = await newViewerSpec({
        template: () => <vertex-viewer clientId={clientId} stream={stream} />,
      });

      const close = jest.spyOn(ws, 'close');
      await loadViewerStreamKey(key1, { stream, ws, viewer });
      await viewer.unload();

      expect(close).toHaveBeenCalled();
    });

    it('clears scene and received frame data', async () => {
      const { stream, ws } = makeViewerStream();
      const viewer = await newViewerSpec({
        template: () => <vertex-viewer clientId={clientId} stream={stream} />,
      });

      await loadViewerStreamKey(key1, { stream, ws, viewer });
      await viewer.unload();

      expect(viewer.frame).toBeUndefined();
    });
  });

  describe('stream attributes', () => {
    it('updates stream when a stream attribute changes', async () => {
      const { stream, ws } = makeViewerStream();
      const viewer = await newViewerSpec({
        template: () => <vertex-viewer clientId={clientId} stream={stream} />,
      });

      const update = jest.spyOn(stream, 'update');
      await loadViewerStreamKey(key1, { stream, ws, viewer });

      viewer.depthBuffers = 'final';
      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({
          streamAttributes: expect.objectContaining({
            depthBuffers: 'final',
          }),
        })
      );

      viewer.experimentalGhostingOpacity = 1;
      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({
          streamAttributes: expect.objectContaining({
            experimentalGhosting: 1,
          }),
        })
      );

      viewer.featureLines = { width: 1 };
      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({
          streamAttributes: expect.objectContaining({
            featureLines: { width: 1 },
          }),
        })
      );

      viewer.featureHighlighting = { highlightColor: 0xff0000 };
      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({
          streamAttributes: expect.objectContaining({
            featureHighlighting: { highlightColor: 0xff0000 },
          }),
        })
      );

      viewer.featureMaps = 'final';
      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({
          streamAttributes: expect.objectContaining({
            featureMaps: 'final',
          }),
        })
      );
    });
  });

  describe('device id', () => {
    it('generates and stores device id', async () => {
      const { stream, ws } = makeViewerStream();
      const viewer = await newViewerSpec({
        template: () => <vertex-viewer clientId={clientId} stream={stream} />,
      });

      const storedDeviceId = Storage.getStorageEntry(
        Storage.StorageKeys.DEVICE_ID,
        (records) => records['device-id']
      );

      const load = jest.spyOn(stream, 'load');
      await loadViewerStreamKey(key1, { stream, ws, viewer });

      expect(storedDeviceId).toBe(viewer.deviceId);
      expect(load).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        storedDeviceId,
        expect.anything()
      );
    });

    it('uses stored device id if available', async () => {
      jest
        .spyOn(Storage, 'getStorageEntry')
        .mockImplementation(() => 'some-device-id');

      const { stream, ws } = makeViewerStream();
      const viewer = await newViewerSpec({
        template: () => <vertex-viewer clientId={clientId} stream={stream} />,
      });

      const load = jest.spyOn(stream, 'load');
      await loadViewerStreamKey(key1, { stream, ws, viewer });

      expect(viewer.deviceId).toBe('some-device-id');
      expect(load).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        viewer.deviceId,
        expect.anything()
      );
    });
  });

  describe('rotate about tap point', () => {
    it('enables depth buffers', async () => {
      const { stream, ws } = makeViewerStream();
      const viewer = await newViewerSpec({
        template: () => (
          <vertex-viewer
            clientId={clientId}
            stream={stream}
            rotateAroundTapPoint={true}
          />
        ),
      });

      const update = jest.spyOn(stream, 'update');
      await loadViewerStreamKey(key1, { viewer, stream, ws });

      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({
          streamAttributes: expect.objectContaining({
            depthBuffers: 'final',
          }),
        })
      );
    });

    it('disables depth buffers when disabled', async () => {
      const { stream, ws } = makeViewerStream();
      const viewer = await newViewerSpec({
        template: () => (
          <vertex-viewer
            clientId={clientId}
            stream={stream}
            rotateAroundTapPoint={false}
          />
        ),
      });

      const update = jest.spyOn(stream, 'update');
      await loadViewerStreamKey(key1, { viewer, stream, ws });

      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({
          streamAttributes: expect.objectContaining({
            depthBuffers: undefined,
          }),
        })
      );
    });
  });

  describe('interaction events', () => {
    it('emits an interaction started event on first interaction', async () => {
      const onInteractionStarted = jest.fn();

      const { stream, ws } = makeViewerStream();
      const viewer = await newViewerSpec({
        template: () => <vertex-viewer clientId={clientId} stream={stream} />,
      });
      await loadViewerStreamKey(key1, { viewer, stream, ws });
      const canvas = viewer.shadowRoot?.querySelector('canvas');

      viewer.addEventListener('interactionStarted', onInteractionStarted);

      canvas?.dispatchEvent(
        new MouseEvent('mousedown', { ...screenPos0, buttons: 1 })
      );

      const delay = viewer.resolvedConfig?.interactions.interactionDelay ?? 0;
      await Async.delay(delay + 5);

      window.dispatchEvent(
        new MouseEvent('mousemove', { ...screenPos50, buttons: 1 })
      );
      window.dispatchEvent(
        new MouseEvent('mouseup', { ...screenPos50, buttons: 1 })
      );

      expect(onInteractionStarted).toHaveBeenCalled();
    });

    it('emits an interaction finished event on last interaction', async () => {
      const onInteractionEnded = jest.fn();

      const { stream, ws } = makeViewerStream();
      const viewer = await newViewerSpec({
        template: () => <vertex-viewer clientId={clientId} stream={stream} />,
      });
      await loadViewerStreamKey(key1, { viewer, stream, ws });
      const canvas = viewer.shadowRoot?.querySelector('canvas');

      viewer.addEventListener('interactionFinished', onInteractionEnded);

      canvas?.dispatchEvent(
        new MouseEvent('mousedown', { ...screenPos0, buttons: 1 })
      );

      const delay = viewer.resolvedConfig?.interactions.interactionDelay ?? 0;
      await Async.delay(delay + 5);

      window.dispatchEvent(
        new MouseEvent('mousemove', { ...screenPos50, buttons: 1 })
      );
      window.dispatchEvent(
        new MouseEvent('mouseup', { ...screenPos50, buttons: 1 })
      );

      expect(onInteractionEnded).toHaveBeenCalled();
    });
  });

  async function newViewerSpec(
    opts: Pick<NewSpecPageOptions, 'template' | 'html'>
  ): Promise<HTMLVertexViewerElement> {
    const page = await newSpecPage({ components: [Viewer], ...opts });
    return page.root as HTMLVertexViewerElement;
  }
});
