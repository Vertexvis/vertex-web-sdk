jest.mock('./utils');
jest.mock('@vertexvis/stream-api');

import '../../testing/domMocks';
import { Viewer } from './viewer';
import { MouseInteractionHandler } from '../../interactions/mouseInteractionHandler';
import { newSpecPage } from '@stencil/core/testing';
import { TouchInteractionHandler } from '../../interactions/touchInteractionHandler';
import {
  getElementBackgroundColor,
  getElementBoundingClientRect,
} from './utils';
import { Color } from '@vertexvis/utils';
import { currentDateAsProtoTimestamp } from '@vertexvis/stream-api';
import * as Fixtures from '../../types/__fixtures__';
import { Config } from '../../config/config';

describe('vertex-viewer', () => {
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

  describe('config', () => {
    it('defaults to production', async () => {
      const viewer = await createViewerSpec(`<vertex-viewer></vertex-viewer>`);

      expect(viewer.getConfig()).toMatchObject({
        network: {
          apiHost: 'https://platform.platprod.vertexvis.io',
          renderingHost: 'wss://stream.platprod.vertexvis.io',
        },
      });
    });

    it('allows for platdev via the config route', async () => {
      const viewer = await createViewerSpec(`<vertex-viewer></vertex-viewer>`);
      viewer.configEnv = 'platdev';
      expect(viewer.getConfig()).toMatchObject({
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
        `<vertex-viewer camera-controls="false"></vertex-viewer>`
      );

      const disposable = await viewer.registerInteractionHandler(handler);
      disposable.dispose();
      expect(handler.dispose).toHaveBeenCalled();

      const handlers = await viewer.getInteractionHandlers();
      expect(handlers).toHaveLength(1);
    });
  });

  describe(Viewer.prototype.load, () => {
    it('loads the scene view for a stream key', async () => {
      const viewer = await createViewerWithLoadedStream('123');
      const api = viewer.getStreamApi();
      expect(api.connect).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('/stream-keys/123/session'),
        }),
        expect.anything()
      );
      expect(api.startStream).toHaveBeenCalled();
    });

    it('starts a stream with a frame background color of the viewer', async () => {
      (getElementBackgroundColor as jest.Mock).mockReturnValue(
        Color.fromHexString('#0000ff')
      );

      const viewer = await createViewerWithLoadedStream('123');
      const api = viewer.getStreamApi();

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

    it('throws exception if scene cannot be loaded', async () => {
      const viewer = await createViewerSpec(`<vertex-viewer></vertex-viewer`);
      (viewer.getStreamApi().connect as jest.Mock).mockRejectedValue(
        new Error('Failed')
      );
      expect(viewer.load('urn:vertexvis:stream-key:123')).rejects.toThrow();
    });
  });

  describe(Viewer.prototype.unload, () => {
    it('disconnects the WS', async () => {
      const viewer = await createViewerWithLoadedStream('123');
      const api = viewer.getStreamApi();

      viewer.unload();
      expect(api.dispose).toHaveBeenCalled();
    });

    it('clears scene and received frame data', async () => {
      const viewer = await createViewerWithLoadedStream('123');
      viewer.unload();

      const frame = await viewer.getFrame();
      expect(frame).toBeUndefined();
    });
  });

  describe('loading a second model', () => {
    it('properly starts the stream, and does not attempt to reconnect the old stream', async () => {
      let viewer: Viewer = await createViewerWithLoadedStream('123', () =>
        viewer.handleWebSocketClose()
      );
      let api = viewer.getStreamApi();
      viewer = await loadNewModelForViewer(
        viewer,
        `urn:vertexvis:stream-key:234`
      );
      api = viewer.getStreamApi();

      expect(api.reconnect).not.toHaveBeenCalled();
    });
  });

  describe('stream attributes', () => {
    const attributes = {
      experimentalGhosting: {
        enabled: { value: true },
        opacity: { value: 0.7 },
      },
    };

    it('maintains configured attributes after being updated', async () => {
      const viewer = await createViewerSpec(`<vertex-viewer></vertex-viewer`);
      const api = viewer.getStreamApi();
      viewer.config = {
        streamAttributes: attributes,
      } as Config;
      await loadNewModelForViewer(viewer, '123');
      const updatedAttributes = {
        experimentalGhosting: {
          ...attributes.experimentalGhosting,
          enabled: { value: false },
        },
      };

      viewer.updateStream(updatedAttributes);

      await viewer.handleWebSocketClose();

      expect(api.reconnect).toHaveBeenCalledWith(
        expect.objectContaining({
          streamAttributes: updatedAttributes,
        })
      );
    });

    it('sends configured stream attributes on stream start', async () => {
      const viewer = await createViewerSpec(`<vertex-viewer></vertex-viewer`);
      const api = viewer.getStreamApi();
      viewer.config = {
        streamAttributes: attributes,
      } as Config;
      await loadNewModelForViewer(viewer, '123');

      expect(api.startStream).toHaveBeenCalledWith(
        expect.objectContaining({
          streamAttributes: attributes,
        })
      );
    });

    it('sends configured stream attributes on reconnect', async () => {
      const viewer = await createViewerSpec(`<vertex-viewer></vertex-viewer`);
      const api = viewer.getStreamApi();
      viewer.config = {
        streamAttributes: attributes,
      } as Config;
      await loadNewModelForViewer(viewer, '123');

      await viewer.handleWebSocketClose();

      expect(api.reconnect).toHaveBeenCalledWith(
        expect.objectContaining({
          streamAttributes: attributes,
        })
      );
    });
  });
});

async function createViewerSpec(html: string): Promise<Viewer> {
  const page = await newSpecPage({ components: [Viewer], html });
  return page.rootInstance as Viewer;
}

async function createViewerWithLoadedStream(
  key: string,
  dispose?: () => void
): Promise<Viewer> {
  const viewer = await createViewerSpec(`<vertex-viewer></vertex-viewer`);

  return loadNewModelForViewer(viewer, key, dispose);
}

async function loadNewModelForViewer(
  viewer: Viewer,
  key: string,
  dispose?: () => void
): Promise<Viewer> {
  const startStream = {
    startStream: {
      sceneViewId: { hex: 'scene-view-id' },
      streamId: { hex: 'stream-id' },
    },
  };
  const syncTime = { syncTime: { replyTime: currentDateAsProtoTimestamp() } };
  const api = viewer.getStreamApi();
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

  const loading = viewer.load(`urn:vertexvis:stream-key:${key}`);

  // Emit frame drawn on next event loop
  setTimeout(() => viewer.dispatchFrameDrawn(Fixtures.frame), 0);
  await loading;
  return viewer;
}
