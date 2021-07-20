jest.mock('@vertexvis/stream-api');
jest.mock('./utils');
jest.mock('../../lib/sessions/storage');

import '../../testing/domMocks';
import {
  getElementBackgroundColor,
  getElementBoundingClientRect,
} from './utils';
import { Viewer } from './viewer';
import { MouseInteractionHandler } from '../../lib/interactions/mouseInteractionHandler';
import { newSpecPage } from '@stencil/core/testing';
import { TouchInteractionHandler } from '../../lib/interactions/touchInteractionHandler';
import { Async, Color } from '@vertexvis/utils';
import { currentDateAsProtoTimestamp } from '@vertexvis/stream-api';
import * as Fixtures from '../../testing/fixtures';
import { upsertStorageEntry } from '../../lib/sessions/storage';
import { vertexvis } from '@vertexvis/frame-streaming-protos';
import Chance from 'chance';

describe('vertex-viewer', () => {
  (getElementBoundingClientRect as jest.Mock).mockReturnValue({
    left: 0,
    top: 0,
    bottom: 150,
    right: 200,
    width: 200,
    height: 150,
  });

  const random = new Chance();

  const streamKey1 = random.hash({ length: 7 });
  const streamKey2 = random.hash({ length: 7 });
  const sceneViewStateId = random.hash({ length: 7 });

  const urn1 = `urn:vertexvis:stream-key:${streamKey1}`;
  const urn2 = `urn:vertexvis:stream-key:${streamKey2}`;

  const screenPos0 = { screenX: 0, screenY: 0 };
  const screenPos50 = { screenX: 50, screenY: 50 };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('config', () => {
    it('defaults to production', async () => {
      const viewer = await createViewerSpec(`<vertex-viewer></vertex-viewer>`);

      expect(viewer.resolvedConfig).toMatchObject({
        network: {
          apiHost: 'https://platform.platprod.vertexvis.io',
          renderingHost: 'wss://stream.platprod.vertexvis.io',
        },
      });
    });

    it('allows for platdev via the config route', async () => {
      const viewer = await createViewerSpec(`<vertex-viewer></vertex-viewer>`);
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
      const viewer = await createViewerSpec(`<vertex-viewer></vertex-viewer>`);
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
      const viewer = await createViewerSpec(
        `<vertex-viewer camera-controls="false"></vertex-viewer>`
      );
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
      const viewer = await createViewerSpec(
        `<vertex-viewer camera-controls="false"></vertex-viewer>`
      );

      viewer.registerInteractionHandler(handler);
      expect(handler.initialize).toHaveBeenCalled();
    });

    it('disposing registered interaction handler removes handler', async () => {
      const viewer = await createViewerSpec(
        `<vertex-viewer camera-controls="false" keyboard-controls="false"></vertex-viewer>`
      );

      const disposable = await viewer.registerInteractionHandler(handler);
      disposable.dispose();
      expect(handler.dispose).toHaveBeenCalled();

      const handlers = await viewer.getInteractionHandlers();
      expect(handlers).toHaveLength(0);
    });
  });

  describe(Viewer.prototype.load, () => {
    it('loads the scene view for a stream key', async () => {
      const viewer = await createViewerWithLoadedStream(urn1);

      const api = viewer.stream;
      expect(api.connect).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('/ws'),
        }),
        expect.anything()
      );
      expect(api.startStream).toHaveBeenCalledWith(
        expect.objectContaining({
          streamKey: {
            value: streamKey1,
          },
        })
      );
    });

    it('loads the scene view with a scene view state', async () => {
      const urn = `${urn1}?scene-view-state=${sceneViewStateId}`;
      const viewer = await createViewerWithLoadedStream(urn);

      const api = viewer.stream;
      expect(api.connect).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('/ws'),
        }),
        expect.anything()
      );
      expect(api.startStream).toHaveBeenCalledWith(
        expect.objectContaining({
          streamKey: {
            value: streamKey1,
          },
          sceneViewStateId: {
            hex: sceneViewStateId,
          },
        })
      );
    });

    it('applies scene view state if loaded', async () => {
      const urn = `${urn1}?scene-view-state=${sceneViewStateId}`;
      const viewer = await createViewerWithLoadedStream(urn1);

      await loadNewModelForViewer(viewer, urn);

      const api = viewer.stream;
      expect(api.loadSceneViewState).toHaveBeenCalledWith(
        expect.objectContaining({
          sceneViewStateId: {
            hex: sceneViewStateId,
          },
        }),
        expect.anything()
      );
    });

    it('reloads if scene view state changed during loading', async () => {
      const viewer = await createViewerSpec(
        `<vertex-viewer client-id="clientId"></vertex-viewer>`
      );

      loadNewModelForViewer(viewer, urn1);

      const urn = `${urn1}?scene-view-state=${sceneViewStateId}`;
      await loadNewModelForViewer(viewer, urn);

      const api = viewer.stream;
      expect(api.connect).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('/ws'),
        }),
        expect.anything()
      );
      expect(api.startStream).toHaveBeenCalledWith(
        expect.objectContaining({
          streamKey: {
            value: streamKey1,
          },
          sceneViewStateId: {
            hex: sceneViewStateId,
          },
        })
      );
    });

    it('starts a stream with a frame background color of the viewer', async () => {
      (getElementBackgroundColor as jest.Mock).mockReturnValue(
        Color.fromHexString('#0000ff')
      );

      const viewer = await createViewerWithLoadedStream(urn1);
      const api = viewer.stream;

      expect(api.startStream).toHaveBeenCalledWith(
        expect.objectContaining({
          frameBackgroundColor: expect.objectContaining({
            r: 0,
            g: 0,
            b: 255,
          }),
        })
      );
    });

    it('starts a stream with a the jwt present on the viewer', async () => {
      const viewer = await createViewerWithLoadedStream(urn1);
      const jwt = await viewer.getJwt();
      expect(jwt).toBeDefined();
    });

    it('throws exception if scene cannot be loaded', async () => {
      const viewer = await createViewerSpec(
        `<vertex-viewer client-id=clientId></vertex-viewer`
      );
      (viewer.stream.connect as jest.Mock).mockRejectedValue(
        new Error('Failed')
      );
      expect(viewer.load(urn1)).rejects.toThrow();
    });

    it('throws an exception if a client id is not provided', async () => {
      const viewer = await createViewerSpec(`<vertex-viewer></vertex-viewer`);
      expect(viewer.load(urn1)).rejects.toThrow();
    });
  });

  describe(Viewer.prototype.unload, () => {
    it('disconnects the WS', async () => {
      const viewer = await createViewerWithLoadedStream(urn1);
      const api = viewer.stream;

      viewer.unload();
      expect(api.dispose).toHaveBeenCalled();
    });

    it('clears scene and received frame data', async () => {
      const viewer = await createViewerWithLoadedStream(urn1);
      viewer.unload();

      const frame = await viewer.frame;
      expect(frame).toBeUndefined();
    });
  });

  describe('loading a second model', () => {
    it('properly starts the stream, and does not attempt to reconnect the old stream', async () => {
      let viewer: HTMLVertexViewerElement = await createViewerWithLoadedStream(
        urn1,
        () => viewer.handleWebSocketClose()
      );
      let api = viewer.stream;
      viewer = await loadNewModelForViewer(viewer, urn2);
      api = viewer.stream;

      expect(api.reconnect).not.toHaveBeenCalled();
    });
  });

  describe('stream attributes', () => {
    const attributes = {
      experimentalGhosting: {
        enabled: { value: true },
        opacity: { value: 0.7 },
      },
      featureLines: {
        width: 2.0,
        color: {
          r: 255,
          g: 0,
          b: 0,
          a: 1,
        },
      },
    };

    it('maintains configured attributes after being updated', async () => {
      const viewer = await createViewerSpec(
        `<vertex-viewer client-id="clientId"></vertex-viewer>`
      );
      const api = viewer.stream;
      viewer.streamAttributes = attributes;
      await loadNewModelForViewer(viewer, urn1);
      const updatedAttributes = {
        experimentalGhosting: {
          ...attributes.experimentalGhosting,
          enabled: { value: false },
        },
      };

      viewer.streamAttributes = updatedAttributes;

      await viewer.handleWebSocketClose();

      expect(api.reconnect).toHaveBeenCalledWith(
        expect.objectContaining({
          streamAttributes: expect.objectContaining(updatedAttributes),
        })
      );
    });

    it('sends configured stream attributes on stream start', async () => {
      const viewer = await createViewerSpec(
        `<vertex-viewer client-id="clientId"></vertex-viewer>`
      );
      const api = viewer.stream;
      viewer.streamAttributes = attributes;
      await loadNewModelForViewer(viewer, urn1);

      expect(api.startStream).toHaveBeenCalledWith(
        expect.objectContaining({
          streamAttributes: expect.objectContaining({
            ...attributes,
            featureLines: {
              lineWidth: attributes.featureLines.width,
              lineColor: {
                r: attributes.featureLines.color.r,
                g: attributes.featureLines.color.g,
                b: attributes.featureLines.color.b,
              },
            },
          }),
        })
      );
    });

    it('sends configured stream attributes on reconnect', async () => {
      const viewer = await createViewerSpec(
        `<vertex-viewer client-id="clientId"></vertex-viewer>`
      );
      const api = viewer.stream;
      viewer.streamAttributes = attributes;
      await loadNewModelForViewer(viewer, urn1);

      await viewer.handleWebSocketClose();

      expect(api.reconnect).toHaveBeenCalledWith(
        expect.objectContaining({
          streamAttributes: expect.objectContaining({
            ...attributes,
            featureLines: {
              lineWidth: attributes.featureLines.width,
              lineColor: {
                r: attributes.featureLines.color.r,
                g: attributes.featureLines.color.g,
                b: attributes.featureLines.color.b,
              },
            },
          }),
        })
      );
    });
  });

  describe('session ids', () => {
    it('passes the specified session id if provided', async () => {
      const viewer = await createViewerSpec(
        `<vertex-viewer client-id="clientId" session-id="sessionId"></vertex-viewer>`
      );
      const api = viewer.stream;
      await loadNewModelForViewer(viewer, urn1);

      expect(api.connect).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringMatching(/sessionId=sessionId/),
        }),
        expect.anything()
      );
    });

    it('does not pass a session id if none is present', async () => {
      const viewer = await createViewerSpec(
        `<vertex-viewer client-id="clientId"></vertex-viewer>`
      );
      const api = viewer.stream;
      await loadNewModelForViewer(viewer, urn1);

      expect(api.connect).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.not.stringMatching(/sessionId=sessionId/),
        }),
        expect.anything()
      );
    });

    it('passes a session id if one is present in storage', async () => {
      upsertStorageEntry('vertexvis:stream-sessions', {
        clientId: 'sessionId1',
      });
      const viewer = await createViewerSpec(
        `<vertex-viewer client-id="clientId"></vertex-viewer>`
      );
      const api = viewer.stream;
      await loadNewModelForViewer(viewer, urn1);

      expect(api.connect).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringMatching(/sessionId=sessionId1/),
        }),
        expect.anything()
      );
    });
  });

  describe('rotate about tap point', () => {
    it('enables depth buffers', async () => {
      const viewer = await createViewerSpec(
        `<vertex-viewer client-id="clientId" rotate-around-tap-point="true"></vertex-viewer>`
      );
      const api = viewer.stream;
      await loadNewModelForViewer(viewer, urn1);

      expect(api.startStream).toHaveBeenCalledWith(
        expect.objectContaining({
          streamAttributes: expect.objectContaining({
            depthBuffers: {
              enabled: { value: true },
              frameType: vertexvis.protobuf.stream.FrameType.FRAME_TYPE_FINAL,
            },
          }),
        })
      );
    });

    it('disables depth buffers when disabled', async () => {
      const viewer = await createViewerSpec(
        `<vertex-viewer client-id="clientId" rotate-around-tap-point="true"></vertex-viewer>`
      );
      const api = viewer.stream;
      await loadNewModelForViewer(viewer, urn1);

      viewer.rotateAroundTapPoint = false;

      expect(api.updateStream).toHaveBeenCalledWith(
        expect.objectContaining({
          streamAttributes: expect.objectContaining({
            depthBuffers: expect.objectContaining({
              enabled: { value: false },
            }),
          }),
        })
      );
    });
  });

  describe('interaction events', () => {
    it('emits an interaction started event on first interaction', async () => {
      const onInteractionStarted = jest.fn();

      const viewer = await createViewerWithLoadedStream(urn1);
      const canvas = viewer.shadowRoot?.querySelector('canvas');

      viewer.addEventListener('interactionStarted', onInteractionStarted);

      canvas?.dispatchEvent(
        new MouseEvent('mousedown', { ...screenPos0, buttons: 1 })
      );

      await Async.delay(
        viewer.resolvedConfig.interactions.interactionDelay + 5
      );

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

      const viewer = await createViewerWithLoadedStream(urn1);
      const canvas = viewer.shadowRoot?.querySelector('canvas');

      viewer.addEventListener('interactionFinished', onInteractionEnded);

      canvas?.dispatchEvent(
        new MouseEvent('mousedown', { ...screenPos0, buttons: 1 })
      );

      await Async.delay(
        viewer.resolvedConfig.interactions.interactionDelay + 5
      );

      window.dispatchEvent(
        new MouseEvent('mousemove', { ...screenPos50, buttons: 1 })
      );
      window.dispatchEvent(
        new MouseEvent('mouseup', { ...screenPos50, buttons: 1 })
      );

      expect(onInteractionEnded).toHaveBeenCalled();
    });
  });
});

async function createViewerSpec(
  html: string
): Promise<HTMLVertexViewerElement> {
  const page = await newSpecPage({ components: [Viewer], html });
  return page.root as HTMLVertexViewerElement;
}

async function createViewerWithLoadedStream(
  urn: string,
  dispose?: () => void
): Promise<HTMLVertexViewerElement> {
  const viewer = await createViewerSpec(
    `<vertex-viewer client-id="clientId"></vertex-viewer>`
  );

  return loadNewModelForViewer(viewer, urn, dispose);
}

async function loadNewModelForViewer(
  viewer: HTMLVertexViewerElement,
  urn: string,
  dispose?: () => void
): Promise<HTMLVertexViewerElement> {
  const startStream = {
    startStream: {
      sceneViewId: { hex: 'scene-view-id' },
      streamId: { hex: 'stream-id' },
      jwt: 'jwt-value',
      worldOrientation: {
        front: { x: 0, y: 0, z: 1 },
        up: { x: 0, y: 1, z: 0 },
      },
    },
  };
  const syncTime = { syncTime: { replyTime: currentDateAsProtoTimestamp() } };
  const api = viewer.stream;
  (api.connect as jest.Mock).mockResolvedValue({
    dispose: () => {
      if (dispose != null) {
        dispose();
      }
      api.dispose();
    },
  });
  (api.startStream as jest.Mock).mockResolvedValue(startStream);
  (api.syncTime as jest.Mock).mockResolvedValue(syncTime);

  const loading = viewer.load(urn);

  // Emit frame drawn on next event loop
  await Async.delay(0);
  viewer.dispatchFrameDrawn(Fixtures.frame);
  await loading;

  return viewer;
}
