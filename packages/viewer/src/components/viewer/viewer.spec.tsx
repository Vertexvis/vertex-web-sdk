import { vertexvis } from '@vertexvis/frame-streaming-protos';

jest.mock('./utils');
jest.mock('../../lib/rendering/imageLoaders');
jest.mock('../../workers/png-decoder-pool');

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h } from '@stencil/core';
import { NewSpecPageOptions, SpecPage } from '@stencil/core/internal';
import { newSpecPage } from '@stencil/core/testing';
import { Dimensions } from '@vertexvis/geometry';
import { Async, UUID } from '@vertexvis/utils';

import { MouseInteractionHandler } from '../../lib/interactions/mouseInteractionHandler';
import { TapInteractionHandler } from '../../lib/interactions/tapInteractionHandler';
import { TouchInteractionHandler } from '../../lib/interactions/touchInteractionHandler';
import { loadImageBytes } from '../../lib/rendering/imageLoaders';
import * as Storage from '../../lib/storage';
import { random } from '../../testing';
import * as Fixtures from '../../testing/fixtures';
import { makeImagePng } from '../../testing/fixtures';
import { triggerResizeObserver } from '../../testing/resizeObserver';
import {
  gracefulReconnect,
  key1,
  key2,
  loadViewerStreamKey,
  makeViewerStream,
  receiveFrame,
} from '../../testing/viewer';
import { getElementBoundingClientRect, getElementPropertyValue } from './utils';
import { Viewer } from './viewer';

describe('vertex-viewer', () => {
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
      expect(handlers).toHaveLength(1);
      expect(handlers[0]).toBeInstanceOf(TapInteractionHandler);
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

      await Async.delay(1);

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
      (getElementPropertyValue as jest.Mock).mockReturnValue('#0000ff');

      const { stream, ws } = makeViewerStream();
      const viewer = await newViewerSpec({
        template: () => (
          <vertex-viewer
            clientId={clientId}
            stream={stream}
            featureLines={{ width: 1 }}
            selectionHighlighting={{
              lineWidth: 2,
              color: '#fff222',
              opacity: 0.3,
            }}
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
            featureLines: { width: 1 },
            featureHighlighting: { highlightColor: 0xff0000 },
            selectionHighlighting: {
              lineWidth: 2,
              color: '#fff222',
              opacity: 0.3,
            },
            featureMaps: 'all',
          }),
          dimensions: { width: 200, height: 150 },
        })
      );
    });

    it('updates the stream with correct stream attributes', async () => {
      (getElementPropertyValue as jest.Mock).mockReturnValue('#00ffff');

      /* eslint-disable @typescript-eslint/no-explicit-any */
      const mutationObserver = (global as any).MutationObserver;
      let observerFns: VoidFunction[] = [];
      (global as any).MutationObserver = class {
        public disconnect = jest.fn();
        public observe = jest.fn();

        public constructor(fn: VoidFunction) {
          observerFns = [...observerFns, fn];
        }
      };
      /* eslint-enable @typescript-eslint/no-explicit-any */

      const { stream, ws } = makeViewerStream();
      const viewer = await newViewerSpec({
        template: () => (
          <vertex-viewer
            clientId={clientId}
            stream={stream}
            featureLines={{ width: 1 }}
            selectionHighlighting={{
              lineWidth: 2,
              color: '#fff222',
              opacity: 0.3,
            }}
            featureHighlighting={{ highlightColor: 0xff0000 }}
            depthBuffers="all"
            featureMaps="all"
          />
        ),
      });

      const update = jest.spyOn(stream, 'update');
      await loadViewerStreamKey(key1, { viewer, stream, ws });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).MutationObserver = mutationObserver;

      observerFns.forEach((fn) => fn());

      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({
          frameBgColor: expect.objectContaining({ r: 0, g: 255, b: 255 }),
          streamAttributes: expect.objectContaining({
            frames: {
              frameBackgroundColor: expect.objectContaining({
                r: 0,
                g: 255,
                b: 255,
              }),
            },
          }),
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

      viewer.phantom = { opacity: 1 };
      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({
          streamAttributes: expect.objectContaining({
            phantom: expect.objectContaining({ opacity: 1 }),
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
      const deviceId = 'device-id';
      const viewer = await newViewerSpec({
        template: () => (
          <vertex-viewer
            clientId={clientId}
            stream={stream}
            deviceId={deviceId}
          />
        ),
      });

      const load = jest.spyOn(stream, 'load');
      await loadViewerStreamKey(key1, { stream, ws, viewer });

      expect(deviceId).toBe(viewer.deviceId);
      expect(load).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        deviceId,
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
      let interactionEndedPromiseResolve: VoidFunction;
      const interactionEndedPromise = new Promise<void>((resolve) => {
        interactionEndedPromiseResolve = resolve;
      });
      const onInteractionEnded = jest.fn();

      const { stream, ws } = makeViewerStream();
      const viewer = await newViewerSpec({
        template: () => <vertex-viewer clientId={clientId} stream={stream} />,
      });
      await loadViewerStreamKey(key1, { viewer, stream, ws });
      const canvas = viewer.shadowRoot?.querySelector('canvas');

      viewer.addEventListener('interactionFinished', () =>
        interactionEndedPromiseResolve()
      );
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

      // Wait for `endInteraction` to fire the `interactionFinished` event.
      // `endInteraction` will wait for any `beginInteraction` to finish
      // prior to processing the call.
      return interactionEndedPromise.then(() => {
        expect(onInteractionEnded).toHaveBeenCalled();
      });
    });
  });

  describe('interaction handlers', () => {
    it('handles toggling cameraControls off', async () => {
      const { stream, ws } = makeViewerStream();
      const { page, viewer } = await newViewerSpecWithPage({
        template: () => (
          <vertex-viewer
            clientId={clientId}
            stream={stream}
            resizeDebounce={1000}
          />
        ),
      });

      await loadViewerStreamKey(key1, { viewer, stream, ws }, { token });

      expect(await viewer.getInteractionHandlers()).toHaveLength(3);

      viewer.cameraControls = false;
      await page.waitForChanges();

      expect(await viewer.getInteractionHandlers()).toHaveLength(1);
      expect((await viewer.getInteractionHandlers())[0]).toBeInstanceOf(
        TapInteractionHandler
      );

      viewer.cameraControls = true;
      await page.waitForChanges();

      expect(await viewer.getInteractionHandlers()).toHaveLength(3);
    });

    it('handles toggling keyboardControls off', async () => {
      const { stream, ws } = makeViewerStream();
      const { page, viewer } = await newViewerSpecWithPage({
        template: () => (
          <vertex-viewer
            clientId={clientId}
            stream={stream}
            resizeDebounce={1000}
          />
        ),
      });

      await loadViewerStreamKey(key1, { viewer, stream, ws }, { token });

      expect(await viewer.getKeyInteractions()).toHaveLength(2);

      viewer.keyboardControls = false;
      await page.waitForChanges();

      expect(await viewer.getKeyInteractions()).toHaveLength(0);

      viewer.keyboardControls = true;
      await page.waitForChanges();

      expect(await viewer.getKeyInteractions()).toHaveLength(2);
    });
  });

  describe('temporal AA', () => {
    it('reuses previous depth buffer if temporal correlation id matches', async () => {
      const { stream, ws } = makeViewerStream();
      const viewer = await newViewerSpec({
        template: () => <vertex-viewer clientId={clientId} stream={stream} />,
      });

      await loadViewerStreamKey(key1, { viewer, stream, ws }, { token });

      const onFrameDrawn = jest.fn();

      viewer.addEventListener('frameDrawn', onFrameDrawn);

      const tcri = new vertexvis.protobuf.core.Uuid({ hex: UUID.create() });

      receiveFrame(ws, (payload) => ({
        ...payload,
        sequenceNumber: 2,
        temporalRefinementCorrelationId: tcri,
      }));

      receiveFrame(ws, (payload) => ({
        ...payload,
        sequenceNumber: 3,
        temporalRefinementCorrelationId: tcri,
        depthBuffer: null,
      }));

      await Async.delay(10);

      expect(onFrameDrawn).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          detail: expect.objectContaining({
            depthBufferBytes:
              Fixtures.drawFramePayloadPerspective.depthBuffer?.value,
          }),
        })
      );
      expect(onFrameDrawn).toHaveBeenNthCalledWith(
        3,
        expect.objectContaining({
          detail: expect.objectContaining({
            depthBufferBytes:
              Fixtures.drawFramePayloadPerspective.depthBuffer?.value,
          }),
        })
      );
    });

    it('does not reuse previous depth buffer if temporal correlation id does not match', async () => {
      const { stream, ws } = makeViewerStream();
      const viewer = await newViewerSpec({
        template: () => <vertex-viewer clientId={clientId} stream={stream} />,
      });

      await loadViewerStreamKey(key1, { viewer, stream, ws }, { token });

      const onFrameDrawn = jest.fn();

      viewer.addEventListener('frameDrawn', onFrameDrawn);

      const tcri = new vertexvis.protobuf.core.Uuid({ hex: UUID.create() });
      const tcri2 = new vertexvis.protobuf.core.Uuid({ hex: UUID.create() });

      receiveFrame(ws, (payload) => ({
        ...payload,
        sequenceNumber: 2,
        temporalRefinementCorrelationId: tcri,
      }));

      receiveFrame(ws, (payload) => ({
        ...payload,
        sequenceNumber: 3,
        temporalRefinementCorrelationId: tcri2,
        depthBuffer: null,
      }));

      await Async.delay(10);

      expect(onFrameDrawn).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          detail: expect.objectContaining({
            depthBufferBytes:
              Fixtures.drawFramePayloadPerspective.depthBuffer?.value,
          }),
        })
      );
      expect(onFrameDrawn).toHaveBeenNthCalledWith(
        3,
        expect.objectContaining({
          detail: expect.objectContaining({
            depthBufferBytes: undefined,
          }),
        })
      );
    });
  });

  describe('resizing', () => {
    it('handles resizes', async () => {
      const { stream, ws } = makeViewerStream();
      const viewer = await newViewerSpec({
        template: () => (
          <vertex-viewer
            clientId={clientId}
            stream={stream}
            resizeDebounce={1000}
          />
        ),
      });

      await loadViewerStreamKey(key1, { viewer, stream, ws }, { token });

      (getElementBoundingClientRect as jest.Mock).mockReturnValue({
        left: 0,
        top: 0,
        bottom: 150,
        right: 200,
        width: 500,
        height: 500,
      });

      jest.useFakeTimers();
      triggerResizeObserver([
        {
          contentRect: { width: 500, height: 500 },
        },
      ]);
      jest.advanceTimersByTime(1000);
      jest.useRealTimers();

      const onFrameDrawn = jest.fn();

      viewer.addEventListener('frameDrawn', onFrameDrawn);

      receiveFrame(ws, (payload) => ({
        ...payload,
        imageAttributes: {
          ...payload.imageAttributes,
          frameDimensions: Dimensions.create(500, 500),
        },
        sequenceNumber: 2,
        image: makeImagePng(500, 500),
      }));

      await Async.delay(10);

      expect(onFrameDrawn).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: expect.objectContaining({
            dimensions: Dimensions.create(500, 500),
          }),
        })
      );
    });

    it('updates stream dimensions when connected', async () => {
      const { stream, ws } = makeViewerStream();
      const viewer = await newViewerSpec({
        template: () => (
          <vertex-viewer
            clientId={clientId}
            stream={stream}
            resizeDebounce={1000}
          />
        ),
      });

      const updateDimensionsSpy = jest.spyOn(stream, 'update');

      await loadViewerStreamKey(
        key1,
        { viewer, stream, ws },
        {
          token,
          beforeConnected: () => {
            (getElementBoundingClientRect as jest.Mock).mockReturnValue({
              left: 0,
              top: 0,
              bottom: 150,
              right: 200,
              width: 500,
              height: 500,
            });

            jest.useFakeTimers();
            triggerResizeObserver([
              {
                contentRect: { width: 500, height: 500 },
              },
            ]);
            jest.advanceTimersByTime(1000);
            jest.useRealTimers();
          },
        }
      );

      expect(updateDimensionsSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          dimensions: Dimensions.create(500, 500),
        })
      );
    });
  });

  describe('frame timing', () => {
    it('handles small and large frames received nearly simultaneously', async () => {
      const { stream, ws } = makeViewerStream();
      const viewer = await newViewerSpec({
        template: () => (
          <vertex-viewer
            clientId={clientId}
            stream={stream}
            resizeDebounce={1000}
          />
        ),
      });

      await loadViewerStreamKey(key1, { viewer, stream, ws }, { token });

      await Async.delay(1);

      const onFrameDrawn = jest.fn();

      viewer.addEventListener('frameDrawn', onFrameDrawn);

      (loadImageBytes as jest.Mock).mockImplementation(async () => {
        await Async.delay(5);

        return {
          width: 200,
          height: 150,
          dispose: () => undefined,
        };
      });

      receiveFrame(ws, (payload) => ({
        ...payload,
        imageAttributes: {
          ...payload.imageAttributes,
          frameDimensions: Dimensions.create(500, 500),
        },
        sequenceNumber: 2,
        image: makeImagePng(500, 500),
      }));

      await Async.delay(1);

      (loadImageBytes as jest.Mock).mockImplementation(async () => ({
        width: 200,
        height: 150,
        dispose: () => undefined,
      }));

      receiveFrame(ws, (payload) => ({
        ...payload,
        imageAttributes: {
          ...payload.imageAttributes,
          frameDimensions: Dimensions.create(1, 1),
        },
        sequenceNumber: 3,
        image: makeImagePng(1, 1),
      }));

      await Async.delay(10);

      expect(onFrameDrawn).toHaveBeenCalledTimes(1);
      expect(onFrameDrawn).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: expect.objectContaining({
            dimensions: Dimensions.create(1, 1),
          }),
        })
      );
    });
  });

  describe('scene', () => {
    it('handles reconnect behavior', async () => {
      const { stream, ws } = makeViewerStream();
      const viewer = await newViewerSpec({
        template: () => (
          <vertex-viewer
            clientId={clientId}
            stream={stream}
            resizeDebounce={1000}
          />
        ),
      });

      await loadViewerStreamKey(key1, { viewer, stream, ws }, { token });

      await Async.delay(1);

      const result = await gracefulReconnect(
        { viewer, stream, ws },
        {
          beforeReconnect: async () => await viewer.scene(),
        }
      );

      expect(result).toBeDefined();
    });
  });

  async function newViewerSpec(
    opts: Pick<NewSpecPageOptions, 'template' | 'html'>
  ): Promise<HTMLVertexViewerElement> {
    const page = await newSpecPage({ components: [Viewer], ...opts });
    return page.root as HTMLVertexViewerElement;
  }

  async function newViewerSpecWithPage(
    opts: Pick<NewSpecPageOptions, 'template' | 'html'>
  ): Promise<{ page: SpecPage; viewer: HTMLVertexViewerElement }> {
    const page = await newSpecPage({ components: [Viewer], ...opts });
    return { page, viewer: page.root as HTMLVertexViewerElement };
  }
});
