jest.mock('./utils');

import { Viewer } from './viewer';
import { MouseInteractionHandler } from '../../interactions/mouseInteractionHandler';
import { newSpecPage } from '@stencil/core/testing';
import { TouchInteractionHandler } from '../../interactions/touchInteractionHandler';
import {
  getElementBackgroundColor,
  getElementBoundingClientRect,
} from './utils';
import { Color } from '@vertexvis/utils';

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

  beforeAll(() => {
    /* eslint-disable */
    (global as any).MutationObserver = class {
      constructor(callback) {}
      disconnect() {}
      observe(element, init) {}
    };
    /* eslint-enable */
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

    it('should initialize interaction handler', async () => {
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
    const startResult = { startStream: { sceneViewId: 'scene-view-id' } };

    it('loads the scene view for a stream key', async () => {
      const viewer = await createViewerSpec(`<vertex-viewer></vertex-viewer`);
      const api = viewer.getStreamApi();
      (api.startStream as jest.Mock).mockResolvedValue(startResult);

      await viewer.load('urn:vertexvis:stream-key:123');

      expect(api.connect).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('/stream-keys/123/session'),
        })
      );
      expect(api.startStream).toHaveBeenCalled();
    });

    it('starts a stream with a frame background color of the viewer', async () => {
      const viewer = await createViewerSpec(`<vertex-viewer></vertex-viewer`);
      const api = viewer.getStreamApi();

      (api.startStream as jest.Mock).mockResolvedValue(startResult);
      (getElementBackgroundColor as jest.Mock).mockReturnValue(
        Color.fromHexString('#0000ff')
      );

      await viewer.load('urn:vertexvis:stream-key:123');

      expect(api.startStream).toHaveBeenCalledWith(
        expect.objectContaining({
          frameBackgroundColor: expect.objectContaining({ r: 0, g: 0, b: 255 }),
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
});

async function createViewerSpec(html: string): Promise<Viewer> {
  const page = await newSpecPage({ components: [Viewer], html });
  return page.rootInstance as Viewer;
}
