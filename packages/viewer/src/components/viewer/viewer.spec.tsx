import type { Mock } from '#test/mock-types';
import { renderSpecPage } from '#test/render-spec-page';
vi.mock('./utils');
vi.mock('../../lib/rendering/imageLoaders');
vi.mock('../../workers/png-decoder-pool');
vi.mock('../../lib/annotations/controller');

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h } from '@stencil/core';
import { render } from '@stencil/vitest';
import { vertexvis } from '@vertexvis/frame-streaming-protos';
import { Dimensions } from '@vertexvis/geometry';
import { Async, UUID } from '@vertexvis/utils';

import { MultiPointerInteractionHandler } from '../../lib/interactions/multiPointerInteractionHandler';
import { PointerInteractionHandler } from '../../lib/interactions/pointerInteractionHandler';
import { TapInteractionHandler } from '../../lib/interactions/tapInteractionHandler';
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

  const clientId = random.string({ alpha: true });
  const token = random.string({ alpha: true });

  const screenPos0 = { screenX: 0, screenY: 0 };
  const screenPos50 = { screenX: 50, screenY: 50 };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe('config', () => {
    it('defaults to production', async () => {
      const { root } = await render(<vertex-viewer />, { waitForReady: false });
      const viewer = root as HTMLVertexViewerElement;

      expect(viewer.resolvedConfig).toMatchObject({
        network: {
          apiHost: 'https://platform.platprod.vertexvis.io',
          renderingHost: 'wss://stream.platprod.vertexvis.io',
        },
      });
    });

    it('allows for platdev via the config route', async () => {
      const { root } = await render(<vertex-viewer />, { waitForReady: false });
      const viewer = root as HTMLVertexViewerElement;
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
      const { root } = await render(<vertex-viewer />, { waitForReady: false });
      const viewer = root as HTMLVertexViewerElement;
      const handlers = await viewer.getInteractionHandlers();

      expect(handlers).toEqual(
        expect.arrayContaining([
          expect.any(PointerInteractionHandler),
          expect.any(MultiPointerInteractionHandler),
        ]),
      );
    });
  });

  describe('when camera-controls prop is false', () => {
    it('does not register camera and touch interaction handlers', async () => {
      const { root } = await render(<vertex-viewer cameraControls={false} />, {
        waitForReady: false,
      });
      const viewer = root as HTMLVertexViewerElement;
      const handlers = await viewer.getInteractionHandlers();

      expect(handlers).not.toEqual(
        expect.arrayContaining([
          expect.any(PointerInteractionHandler),
          expect.any(MultiPointerInteractionHandler),
        ]),
      );
    });
  });

  describe('Viewer.prototype.registerInteractionHandler', () => {
    const handler = {
      dispose: vi.fn(),
      initialize: vi.fn(),
    };

    it('initializes interaction handler', async () => {
      const { root } = await render(<vertex-viewer cameraControls={false} />, {
        waitForReady: false,
      });
      const viewer = root as HTMLVertexViewerElement;

      await viewer.registerInteractionHandler(handler);
      expect(handler.initialize).toHaveBeenCalled();
    });

    it('disposing registered interaction handler removes handler', async () => {
      const { root } = await render(
        <vertex-viewer cameraControls={false} keyboardControls={false} />,
        { waitForReady: false },
      );
      const viewer = root as HTMLVertexViewerElement;

      const disposable = await viewer.registerInteractionHandler(handler);
      disposable.dispose();
      expect(handler.dispose).toHaveBeenCalled();

      const handlers = await viewer.getInteractionHandlers();
      expect(handlers).toHaveLength(1);
      expect(handlers[0]).toBeInstanceOf(TapInteractionHandler);
    });
  });

  describe('Viewer.prototype.load', () => {
    it('emits connection, frame and scene events', async () => {
      const { stream, ws } = makeViewerStream();
      const viewer = (
        await render(<vertex-viewer clientId={clientId} stream={stream} />, {
          waitForReady: false,
        })
      ).root as HTMLVertexViewerElement;

      const onConnectionChange = vi.fn();
      const onSceneReady = vi.fn();
      const onFrameReceived = vi.fn();
      const onFrameDrawn = vi.fn();

      viewer.addEventListener('connectionChange', onConnectionChange);
      viewer.addEventListener('sceneReady', onSceneReady);
      viewer.addEventListener('frameReceived', onFrameReceived);
      viewer.addEventListener('frameDrawn', onFrameDrawn);
      await loadViewerStreamKey(key1, { viewer, stream, ws }, { token });

      await Async.delay(1);

      expect(onConnectionChange).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: { status: 'connecting' },
        }),
      );
      expect(onConnectionChange).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: { status: 'connected', jwt: token },
        }),
      );
      expect(onSceneReady).toHaveBeenCalled();
      expect(onFrameReceived).toHaveBeenCalled();
      expect(onFrameDrawn).toHaveBeenCalled();

      expect(viewer.token).toBe(token);
      expect(viewer.frame).toBeDefined();
    });

    it('loads different stream key', async () => {
      const { stream, ws } = makeViewerStream();
      const viewer = (
        await render(<vertex-viewer clientId={clientId} stream={stream} />, {
          waitForReady: false,
        })
      ).root as HTMLVertexViewerElement;

      const onSceneReady = vi.fn();
      viewer.addEventListener('sceneReady', onSceneReady);

      await loadViewerStreamKey(key1, { viewer, stream, ws }, { token });
      expect(onSceneReady).toHaveBeenCalled();
      expect(viewer.token).toBe(token);
      onSceneReady.mockClear();

      const token2 = random.string();
      await loadViewerStreamKey(
        key2,
        { viewer, stream, ws },
        { token: token2 },
      );
      expect(onSceneReady).toHaveBeenCalled();
      expect(viewer.token).toBe(token2);
    });

    it('loads stream with correct stream attributes', async () => {
      (getElementPropertyValue as Mock).mockReturnValue('#0000ff');

      const { stream, ws } = makeViewerStream();
      const viewer = (
        await render(
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
          />,
          { waitForReady: false },
        )
      ).root as HTMLVertexViewerElement;

      const update = vi.spyOn(stream, 'update');
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
        }),
      );
    });

    it('updates the stream with correct stream attributes', async () => {
      (getElementPropertyValue as Mock).mockReturnValue('#00ffff');

      /* eslint-disable @typescript-eslint/no-explicit-any */
      const mutationObserver = (global as any).MutationObserver;
      let observerFns: VoidFunction[] = [];
      (global as any).MutationObserver = class {
        public disconnect = vi.fn();
        public observe = vi.fn();

        public constructor(fn: VoidFunction) {
          observerFns = [...observerFns, fn];
        }
      };
      /* eslint-enable @typescript-eslint/no-explicit-any */

      const { stream, ws } = makeViewerStream();
      const viewer = (
        await render(
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
          />,
          { waitForReady: false },
        )
      ).root as HTMLVertexViewerElement;

      const update = vi.spyOn(stream, 'update');
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
        }),
      );
    });

    it('only emits a scene ready event if the stream connects successfully', async () => {
      const { stream, ws } = makeViewerStream();
      const viewer = (
        await render(<vertex-viewer clientId={clientId} stream={stream} />, {
          waitForReady: false,
        })
      ).root as HTMLVertexViewerElement;

      const onConnectionChange = vi.fn();
      const onSceneReady = vi.fn();
      viewer.addEventListener('connectionChange', onConnectionChange);
      viewer.addEventListener('sceneReady', onSceneReady);

      let loadPromiseResolve: VoidFunction = vi.fn();
      const loadPromise = new Promise<void>((resolve) => {
        loadPromiseResolve = resolve;
      });

      // Intentionally wait for a promise that only resolves at the end of the test to verify
      // that the scene ready event is only emitted if the stream connects successfully.
      loadViewerStreamKey(
        key1,
        { viewer, stream, ws },
        { token, beforeConnected: async () => loadPromise },
      );

      await Async.delay(1);
      expect(onConnectionChange).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: { status: 'connecting' },
        }),
      );

      onConnectionChange.mockClear();
      await loadViewerStreamKey(key2, { viewer, stream, ws }, { token });

      await Async.delay(1);
      expect(onConnectionChange).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: { status: 'connecting' },
        }),
      );
      expect(onConnectionChange).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: { status: 'connected', jwt: token },
        }),
      );
      expect(onSceneReady).toHaveBeenCalledTimes(1);

      expect(viewer.token).toBe(token);
      expect(viewer.frame).toBeDefined();

      loadPromiseResolve();
    });
  });

  describe('Viewer.prototype.unload', () => {
    it('disconnects the WS', async () => {
      const { stream, ws } = makeViewerStream();
      const viewer = (
        await render(<vertex-viewer clientId={clientId} stream={stream} />, {
          waitForReady: false,
        })
      ).root as HTMLVertexViewerElement;

      const close = vi.spyOn(ws, 'close');
      await loadViewerStreamKey(key1, { stream, ws, viewer });
      await viewer.unload();

      expect(close).toHaveBeenCalled();
    });

    it('clears scene and received frame data', async () => {
      const { stream, ws } = makeViewerStream();
      const viewer = (
        await render(<vertex-viewer clientId={clientId} stream={stream} />, {
          waitForReady: false,
        })
      ).root as HTMLVertexViewerElement;

      await loadViewerStreamKey(key1, { stream, ws, viewer });

      expect(viewer.frame).not.toBeUndefined();

      await viewer.unload();

      expect(viewer.frame).toBeUndefined();
    });
  });

  describe('connection failure behavior', () => {
    it('displays a connection error with a retry button that reloads the viewer', async () => {
      const reload = vi
        .spyOn(customElements.get('vertex-viewer')!.prototype, 'reload')
        .mockResolvedValue(undefined);
      const { stream } = makeViewerStream();
      const page = await renderSpecPage({
        components: [Viewer],
        template: () => <vertex-viewer stream={stream} />,
      });
      const viewer = page.root as HTMLVertexViewerElement;

      stream.stateChanged.emit({
        type: 'connection-failed',
        message: 'Unable to connect.',
      });
      await page.waitForChanges();

      expect(viewer.shadowRoot?.querySelector('.error-message')).toEqualText(
        'Unable to connect.',
      );
      expect(
        viewer.shadowRoot?.querySelector('slot[name="retry"]'),
      ).not.toBeNull();
      expect(
        viewer.shadowRoot?.querySelector('button.button.button-secondary'),
      ).not.toBeNull();

      const retry = viewer.shadowRoot?.querySelector(
        'button.button.button-secondary',
      ) as HTMLButtonElement;

      retry.click();

      expect(reload).toHaveBeenCalled();
    });

    it('allows overriding the default retry button behavior', async () => {
      const reload = vi
        .spyOn(customElements.get('vertex-viewer')!.prototype, 'reload')
        .mockResolvedValue(undefined);
      const customRetryHandler = vi.fn();
      const { stream } = makeViewerStream();
      const page = await renderSpecPage({
        components: [Viewer],
        template: () => (
          <vertex-viewer stream={stream}>
            <button slot="retry" onClick={customRetryHandler}>
              Try again
            </button>
          </vertex-viewer>
        ),
      });
      const viewer = page.root as HTMLVertexViewerElement;
      const retry = viewer.querySelector('[slot="retry"]') as HTMLButtonElement;

      stream.stateChanged.emit({
        type: 'connection-failed',
        message: 'Unable to connect.',
      });
      await page.waitForChanges();

      retry.dispatchEvent(new MouseEvent('click'));
      expect(customRetryHandler).toHaveBeenCalled();
      expect(reload).not.toHaveBeenCalled();
    });
  });

  describe('disconnect behavior', () => {
    it('should pause the stream and close the websocket when disconnected', async () => {
      const { stream, ws } = makeViewerStream();
      const viewer = (
        await render(<vertex-viewer clientId={clientId} stream={stream} />, {
          waitForReady: false,
        })
      ).root as HTMLVertexViewerElement;

      const close = vi.spyOn(ws, 'close');
      const pause = vi.spyOn(stream, 'pause');
      await loadViewerStreamKey(key1, { stream, ws, viewer });
      viewer.remove();

      expect(close).toHaveBeenCalled();
      expect(pause).toHaveBeenCalled();
    });
  });

  describe('reconnect behavior', () => {
    it('should reconnect to a paused stream', async () => {
      const { stream, ws } = makeViewerStream();
      const viewer = (
        await render(<vertex-viewer clientId={clientId} stream={stream} />, {
          waitForReady: false,
        })
      ).root as HTMLVertexViewerElement;

      const pause = vi.spyOn(stream, 'pause');
      const resume = vi.spyOn(stream, 'resume');
      const viewerParent = viewer.parentElement;
      await loadViewerStreamKey(key1, { stream, ws, viewer });
      viewer.remove();

      viewerParent?.appendChild(viewer);

      expect(pause).toHaveBeenCalled();
      expect(resume).toHaveBeenCalled();
    });
  });

  describe('stream attributes', () => {
    it('updates stream when a stream attribute changes', async () => {
      const { stream, ws } = makeViewerStream();
      const viewer = (
        await render(<vertex-viewer clientId={clientId} stream={stream} />, {
          waitForReady: false,
        })
      ).root as HTMLVertexViewerElement;

      const update = vi.spyOn(stream, 'update');
      await loadViewerStreamKey(key1, { stream, ws, viewer });

      vi.useFakeTimers();
      viewer.depthBuffers = 'all';
      vi.advanceTimersByTime(50);
      vi.useRealTimers();
      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({
          streamAttributes: expect.objectContaining({
            depthBuffers: 'all',
          }),
        }),
      );

      vi.useFakeTimers();
      viewer.phantom = { opacity: 1 };
      vi.advanceTimersByTime(50);
      vi.useRealTimers();
      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({
          streamAttributes: expect.objectContaining({
            phantom: expect.objectContaining({ opacity: 1 }),
          }),
        }),
      );

      vi.useFakeTimers();
      viewer.featureLines = { width: 1 };
      vi.advanceTimersByTime(50);
      vi.useRealTimers();
      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({
          streamAttributes: expect.objectContaining({
            featureLines: { width: 1 },
          }),
        }),
      );

      vi.useFakeTimers();
      viewer.featureHighlighting = { highlightColor: 0xff0000 };
      vi.advanceTimersByTime(50);
      vi.useRealTimers();
      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({
          streamAttributes: expect.objectContaining({
            featureHighlighting: { highlightColor: 0xff0000 },
          }),
        }),
      );

      vi.useFakeTimers();
      viewer.featureMaps = 'final';
      vi.advanceTimersByTime(50);
      vi.useRealTimers();
      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({
          streamAttributes: expect.objectContaining({
            featureMaps: 'final',
          }),
        }),
      );

      vi.useFakeTimers();
      viewer.crossSectioning = {};
      viewer.crossSectioning.endCapEnabled = true;
      viewer.crossSectioning.endCapColor = '#112233';
      vi.advanceTimersByTime(50);
      vi.useRealTimers();
      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({
          streamAttributes: expect.objectContaining({
            crossSectioning: expect.objectContaining({
              endCapEnabled: true,
              endCapColor: '#112233',
            }),
          }),
        }),
      );
    });
  });

  describe('device id', () => {
    it('generates and stores device id', async () => {
      const { stream, ws } = makeViewerStream();
      const deviceId = 'device-id';
      const viewer = (
        await render(
          <vertex-viewer
            clientId={clientId}
            stream={stream}
            deviceId={deviceId}
          />,
          { waitForReady: false },
        )
      ).root as HTMLVertexViewerElement;

      const load = vi.spyOn(stream, 'load');
      await loadViewerStreamKey(key1, { stream, ws, viewer });

      expect(deviceId).toBe(viewer.deviceId);
      expect(load).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        deviceId,
        expect.anything(),
        undefined,
      );
    });

    it('uses stored device id if available', async () => {
      vi.spyOn(Storage, 'getStorageEntry').mockImplementation(
        () => 'some-device-id',
      );

      const { stream, ws } = makeViewerStream();
      const viewer = (
        await render(<vertex-viewer clientId={clientId} stream={stream} />, {
          waitForReady: false,
        })
      ).root as HTMLVertexViewerElement;

      const load = vi.spyOn(stream, 'load');
      await loadViewerStreamKey(key1, { stream, ws, viewer });

      expect(viewer.deviceId).toBe('some-device-id');
      expect(load).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        viewer.deviceId,
        expect.anything(),
        undefined,
      );
    });
  });

  describe('rotate about tap point', () => {
    it('enables depth buffers', async () => {
      const { stream, ws } = makeViewerStream();
      const viewer = (
        await render(
          <vertex-viewer
            clientId={clientId}
            stream={stream}
            rotateAroundTapPoint={true}
          />,
          { waitForReady: false },
        )
      ).root as HTMLVertexViewerElement;

      const update = vi.spyOn(stream, 'update');
      await loadViewerStreamKey(key1, { viewer, stream, ws });

      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({
          streamAttributes: expect.objectContaining({
            depthBuffers: 'final',
          }),
        }),
      );
    });

    it('disables depth buffers when disabled', async () => {
      const { stream, ws } = makeViewerStream();
      const viewer = (
        await render(
          <vertex-viewer
            clientId={clientId}
            stream={stream}
            rotateAroundTapPoint={false}
          />,
          { waitForReady: false },
        )
      ).root as HTMLVertexViewerElement;

      const update = vi.spyOn(stream, 'update');
      await loadViewerStreamKey(key1, { viewer, stream, ws });

      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({
          streamAttributes: expect.objectContaining({
            depthBuffers: undefined,
          }),
        }),
      );
    });
  });

  describe('interaction events', () => {
    it('emits an interaction started event on first interaction', async () => {
      const onInteractionStarted = vi.fn();

      const { stream, ws } = makeViewerStream();
      const viewer = (
        await render(<vertex-viewer clientId={clientId} stream={stream} />, {
          waitForReady: false,
        })
      ).root as HTMLVertexViewerElement;
      await loadViewerStreamKey(key1, { viewer, stream, ws });
      const canvas = viewer.shadowRoot?.querySelector('canvas');

      viewer.addEventListener('interactionStarted', onInteractionStarted);

      canvas?.dispatchEvent(
        new PointerEvent('pointerdown', {
          ...screenPos0,
          buttons: 1,
          pointerId: 1,
        }),
      );

      const delay = viewer.resolvedConfig?.interactions.interactionDelay ?? 0;
      await Async.delay(delay + 5);

      window.dispatchEvent(
        new PointerEvent('pointermove', {
          ...screenPos50,
          buttons: 1,
          pointerId: 1,
        }),
      );
      window.dispatchEvent(
        new PointerEvent('pointerup', {
          ...screenPos50,
          buttons: 1,
          pointerId: 1,
        }),
      );

      expect(onInteractionStarted).toHaveBeenCalled();
    });

    it('emits an interaction finished event on last interaction', async () => {
      let interactionFinishedPromiseResolve: VoidFunction;
      const interactionFinishedPromise = new Promise<void>((resolve) => {
        interactionFinishedPromiseResolve = resolve;
      });
      const onInteractionFinished = vi.fn();

      const { stream, ws } = makeViewerStream();
      const viewer = (
        await render(<vertex-viewer clientId={clientId} stream={stream} />, {
          waitForReady: false,
        })
      ).root as HTMLVertexViewerElement;
      await loadViewerStreamKey(key1, { viewer, stream, ws });
      const canvas = viewer.shadowRoot?.querySelector('canvas');

      viewer.addEventListener('interactionFinished', () =>
        interactionFinishedPromiseResolve(),
      );
      viewer.addEventListener('interactionFinished', onInteractionFinished);

      canvas?.dispatchEvent(
        new PointerEvent('pointerdown', {
          ...screenPos0,
          buttons: 1,
          pointerId: 1,
        }),
      );

      const delay = viewer.resolvedConfig?.interactions.interactionDelay ?? 0;
      await Async.delay(delay + 5);

      window.dispatchEvent(
        new PointerEvent('pointermove', {
          ...screenPos50,
          buttons: 1,
          pointerId: 1,
        }),
      );
      window.dispatchEvent(
        new PointerEvent('pointerup', {
          ...screenPos50,
          buttons: 1,
          pointerId: 1,
        }),
      );

      // Wait for `endInteraction` to fire the `interactionFinished` event.
      // `endInteraction` will wait for any `beginInteraction` to finish
      // prior to processing the call.
      return interactionFinishedPromise.then(() => {
        expect(onInteractionFinished).toHaveBeenCalled();
      });
    });
  });

  describe('interaction handlers', () => {
    it('handles toggling cameraControls off', async () => {
      const { stream, ws } = makeViewerStream();
      const page = await renderSpecPage({
        components: [Viewer],
        template: () => (
          <vertex-viewer
            clientId={clientId}
            stream={stream}
            resizeDebounce={1000}
          />
        ),
      });
      const viewer = page.root as HTMLVertexViewerElement;

      await loadViewerStreamKey(key1, { viewer, stream, ws }, { token });

      expect(await viewer.getInteractionHandlers()).toHaveLength(3);

      viewer.cameraControls = false;
      await page.waitForChanges();

      expect(await viewer.getInteractionHandlers()).toHaveLength(1);
      expect((await viewer.getInteractionHandlers())[0]).toBeInstanceOf(
        TapInteractionHandler,
      );

      viewer.cameraControls = true;
      await page.waitForChanges();

      expect(await viewer.getInteractionHandlers()).toHaveLength(3);
    });

    it('handles toggling keyboardControls off', async () => {
      const { stream, ws } = makeViewerStream();
      const page = await renderSpecPage({
        components: [Viewer],
        template: () => (
          <vertex-viewer
            clientId={clientId}
            stream={stream}
            resizeDebounce={1000}
          />
        ),
      });
      const viewer = page.root as HTMLVertexViewerElement;

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
      const viewer = (
        await render(<vertex-viewer clientId={clientId} stream={stream} />, {
          waitForReady: false,
        })
      ).root as HTMLVertexViewerElement;

      await loadViewerStreamKey(key1, { viewer, stream, ws }, { token });

      const onFrameDrawn = vi.fn();

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

      const expectedBytes = Array.from(
        Fixtures.drawFramePayloadPerspective.depthBuffer?.value ?? [],
      );
      expect(
        onFrameDrawn.mock.calls.map(([event]) => event.detail.sequenceNumber),
      ).toEqual([1, 2, 3]);
      expect(
        Array.from(onFrameDrawn.mock.calls[1][0].detail.depthBufferBytes ?? []),
      ).toEqual(expectedBytes);
      expect(
        Array.from(onFrameDrawn.mock.calls[2][0].detail.depthBufferBytes ?? []),
      ).toEqual(expectedBytes);
    });

    it('does not reuse previous depth buffer if temporal correlation id does not match', async () => {
      const { stream, ws } = makeViewerStream();
      const viewer = (
        await render(<vertex-viewer clientId={clientId} stream={stream} />, {
          waitForReady: false,
        })
      ).root as HTMLVertexViewerElement;

      await loadViewerStreamKey(key1, { viewer, stream, ws }, { token });

      const onFrameDrawn = vi.fn();

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

      expect(
        onFrameDrawn.mock.calls.map(([event]) => event.detail.sequenceNumber),
      ).toEqual([1, 2, 3]);
      expect(
        Array.from(onFrameDrawn.mock.calls[1][0].detail.depthBufferBytes ?? []),
      ).toEqual(
        Array.from(
          Fixtures.drawFramePayloadPerspective.depthBuffer?.value ?? [],
        ),
      );
      expect(
        onFrameDrawn.mock.calls[2][0].detail.depthBufferBytes,
      ).toBeUndefined();
    });
  });

  describe('resizing', () => {
    it('handles resizes', async () => {
      const { stream, ws } = makeViewerStream();
      const viewer = (
        await render(
          <vertex-viewer
            clientId={clientId}
            stream={stream}
            resizeDebounce={1000}
          />,
          { waitForReady: false },
        )
      ).root as HTMLVertexViewerElement;

      await loadViewerStreamKey(key1, { viewer, stream, ws }, { token });

      (getElementBoundingClientRect as Mock).mockReturnValue({
        left: 0,
        top: 0,
        bottom: 150,
        right: 200,
        width: 500,
        height: 500,
      });

      vi.useFakeTimers();
      triggerResizeObserver([
        {
          contentRect: { width: 500, height: 500 },
        },
      ]);
      vi.advanceTimersByTime(1000);
      vi.useRealTimers();

      const onFrameDrawn = vi.fn();

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
        }),
      );
    });

    it('updates stream dimensions when connected', async () => {
      const { stream, ws } = makeViewerStream();
      const viewer = (
        await render(
          <vertex-viewer
            clientId={clientId}
            stream={stream}
            resizeDebounce={1000}
          />,
          { waitForReady: false },
        )
      ).root as HTMLVertexViewerElement;

      const updateDimensionsSpy = vi.spyOn(stream, 'update');

      await loadViewerStreamKey(
        key1,
        { viewer, stream, ws },
        {
          token,
          beforeConnected: () => {
            (getElementBoundingClientRect as Mock).mockReturnValue({
              left: 0,
              top: 0,
              bottom: 150,
              right: 200,
              width: 500,
              height: 500,
            });

            vi.useFakeTimers();
            triggerResizeObserver([
              {
                contentRect: { width: 500, height: 500 },
              },
            ]);
            vi.advanceTimersByTime(1000);
            vi.useRealTimers();
          },
        },
      );

      expect(updateDimensionsSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          dimensions: Dimensions.create(500, 500),
        }),
      );
    });
  });

  describe('frame timing', () => {
    it('handles small and large frames received nearly simultaneously', async () => {
      const { stream, ws } = makeViewerStream();
      const viewer = (
        await render(
          <vertex-viewer
            clientId={clientId}
            stream={stream}
            resizeDebounce={1000}
          />,
          { waitForReady: false },
        )
      ).root as HTMLVertexViewerElement;

      await loadViewerStreamKey(key1, { viewer, stream, ws }, { token });

      await Async.delay(1);

      const onFrameDrawn = vi.fn();

      viewer.addEventListener('frameDrawn', onFrameDrawn);

      (loadImageBytes as Mock).mockImplementation(async () => {
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

      (loadImageBytes as Mock).mockImplementation(async () => ({
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
        }),
      );
    });
  });

  describe('scene', () => {
    it('handles reconnect behavior', async () => {
      const { stream, ws } = makeViewerStream();
      const viewer = (
        await render(
          <vertex-viewer
            clientId={clientId}
            stream={stream}
            resizeDebounce={1000}
          />,
          { waitForReady: false },
        )
      ).root as HTMLVertexViewerElement;

      await loadViewerStreamKey(key1, { viewer, stream, ws }, { token });

      await Async.delay(1);

      const result = await gracefulReconnect(
        { viewer, stream, ws },
        {
          beforeReconnect: async () => await viewer.scene(),
        },
      );

      expect(result).toBeDefined();
    });
  });

  describe('annotations', () => {
    it('polls for annotations if experimental flag is set', async () => {
      const interval = random.integer();

      const { stream, ws } = makeViewerStream();
      const viewer = (
        await render(
          <vertex-viewer
            clientId={clientId}
            stream={stream}
            config={
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              { EXPERIMENTAL_annotationPollingIntervalInMs: interval } as any
            }
          />,
          { waitForReady: false },
        )
      ).root as HTMLVertexViewerElement;

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const connectSpy = vi.spyOn(viewer.annotations!, 'connect');

      await loadViewerStreamKey(key1, { viewer, stream, ws }, { token });
      await Async.delay(1);

      expect(connectSpy).toHaveBeenCalledWith(interval);
    });

    it('does not poll for annotations by default', async () => {
      const { stream, ws } = makeViewerStream();
      const viewer = (
        await render(<vertex-viewer clientId={clientId} stream={stream} />, {
          waitForReady: false,
        })
      ).root as HTMLVertexViewerElement;

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const connectSpy = vi.spyOn(viewer.annotations!, 'connect');

      await loadViewerStreamKey(key1, { viewer, stream, ws }, { token });
      await Async.delay(1);

      expect(connectSpy).not.toHaveBeenCalled();
    });

    it('sets the depth buffers value depending if annotations are present', async () => {
      const { stream, ws } = makeViewerStream();
      const viewer = (
        await render(
          <vertex-viewer
            clientId={clientId}
            stream={stream}
            rotateAroundTapPoint={false}
          />,
          { waitForReady: false },
        )
      ).root as HTMLVertexViewerElement;

      const update = vi.spyOn(stream, 'update');

      await loadViewerStreamKey(key1, { viewer, stream, ws }, { token });

      expect(viewer.depthBuffers).toEqual(undefined);

      // Set depthBuffers to 'final' when there are annotations
      viewer.annotations?.onStateChange.emit({
        annotations: {
          annotationSetId: [],
        },
      });

      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({
          streamAttributes: expect.objectContaining({
            depthBuffers: 'final',
          }),
        }),
      );

      update.mockClear();

      // Remove depthBuffers override when there are no annotations
      viewer.annotations?.onStateChange.emit({
        annotations: {},
      });

      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({
          streamAttributes: expect.objectContaining({
            depthBuffers: undefined,
          }),
        }),
      );
    });
  });
});
