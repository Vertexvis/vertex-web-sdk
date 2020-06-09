import { Viewer } from './viewer';
import { MouseInteractionHandler } from '../../interactions/mouseInteractionHandler';
import { newSpecPage, SpecPage } from '@stencil/core/testing';
import { TouchInteractionHandler } from '../../interactions/touchInteractionHandler';
import { createHttpClientMock } from '../../testing/httpClient';

beforeEach(() => {
  jest.clearAllMocks();
  jest.resetAllMocks();
});

describe('vertex-viewer', () => {
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
          apiHost: 'https://api.prod.vertexvis.io',
          renderingHost: 'wss://rendering.prod.vertexvis.io',
        },
      });
    });
  });

  describe('configEnv', () => {
    it('uses environment defaults', async () => {
      const viewer = await createViewerSpec(
        `<vertex-viewer config-env="staging"></vertex-viewer>`
      );

      expect(viewer.getConfig()).toMatchObject({
        network: {
          apiHost: 'https://api.staging.vertexvis.io',
          renderingHost: 'wss://rendering.staging.vertexvis.io',
        },
      });
    });
  });

  describe('credentials', () => {
    it('should decode JSON credentials string', async () => {
      const json = JSON.stringify({ strategy: 'api-key', token: 'token' });

      const viewer = await createViewerSpec(
        `<vertex-viewer credentials=${json}></vertex-viewer>`
      );

      expect(viewer.getCredentials()).toEqual({
        strategy: 'api-key',
        token: 'token',
      });
    });

    it('should set credentials from oauth2 properties', async () => {
      const clientId = 'client-id';
      const token = 'token';

      const viewer = await createViewerSpec(
        `<vertex-viewer credentials-client-id="${clientId}" credentials-token="${token}"></vertex-viewer>`
      );

      expect(viewer.getCredentials()).toEqual({
        strategy: 'oauth2',
        clientId: clientId,
        token: 'token',
      });
    });

    it('should set credentials from api key properties', async () => {
      const apiKey = 'apiKey';

      const viewer = await createViewerSpec(
        `<vertex-viewer credentials-api-key="${apiKey}"></vertex-viewer>`
      );

      expect(viewer.getCredentials()).toEqual({
        strategy: 'api-key',
        token: apiKey,
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

  describe(Viewer.prototype.newScene, () => {
    it('returns new scene builder with http client', async () => {
      const mockHttpClient = createHttpClientMock({
        sceneStateId: 'scene-state-id',
      });
      const viewer = await createViewerSpec(`<vertex-viewer></vertex-viewer>`);
      viewer.httpClient = mockHttpClient;

      const newScene = await viewer.newScene();
      const scene = await newScene
        .from('urn:vertexvis:eedc:file:file-id')
        .execute();

      expect(scene).toContain('scene-state-id');
    });
  });

  describe(Viewer.prototype.scene, () => {
    it("throws an error if a scene hasn't been loaded", async () => {
      const viewer = await createViewerSpec(`<vertex-viewer></vertex-viewer>`);
      expect(viewer.scene()).rejects.toThrow();
    });

    it('returns scene for loaded scene', async () => {
      const viewer = await createViewerSpec(`<vertex-viewer></vertex-viewer>`);
      const mockHttpClient = createHttpClientMock({
        sceneStateId: 'scene-state-id',
      });
      viewer.httpClient = mockHttpClient;

      await viewer.load('urn:vertexvis:eedc:scenestate:scene-state-id');
      const scene = await viewer.scene();
      await scene.clearAllHighlights().execute();

      expect(mockHttpClient).toHaveBeenCalledWith(
        expect.objectContaining({
          url: `/scene_states/scene-state-id/bulk_bom_items`,
        })
      );
    });
  });

  describe(Viewer.prototype.load, () => {
    it('loads a scene', async () => {
      const viewer = await createViewerSpec(`<vertex-viewer></vertex-viewer`);
      await viewer.load('urn:vertexvis:eedc:file:file-id');
      const scene = await viewer.scene();
      expect(scene).toBeDefined();
    });

    it('throws exception if scene cannot be loaded', async () => {
      const viewer = await createViewerSpec(`<vertex-viewer></vertex-viewer`);
      viewer.registerCommand('stream.connect', () => () => {
        throw 'oops';
      });
      expect(viewer.load('urn:vertexvis:eedc:file:file-id')).rejects.toThrow();
    });
  });

  describe('resize', () => {
    it('calls the resize-stream command', async () => {
      const viewerPage = await createViewerPage(
        `<vertex-viewer></vertex-viewer`
      );
      const viewer = await createViewerSpec(viewerPage);
      await viewer.load('urn:vertexvis:eedc:file:file-id');
      const commandPromise = new Promise(resolve => {
        viewer.registerCommand('stream.resize-stream', dimensions => {
          return ({ stream }) => {
            resolve(dimensions);
          };
        });
      });

      window.dispatchEvent(new Event('resize'));

      await viewerPage.waitForChanges();

      expect(await commandPromise).toMatchObject({
        dimensions: {
          width: 0,
          height: 0,
        },
      });
    });
  });
});

async function createViewerPage(html: string): Promise<SpecPage> {
  const page = await newSpecPage({ components: [Viewer], html });
  const viewer = page.rootInstance as Viewer;

  viewer.registerCommand('stream.connect', () => () => Promise.resolve());
  viewer.registerCommand('stream.load-model', () => () =>
    Promise.resolve({ sceneStateId: 'scene-state-id' })
  );

  return page;
}

async function createViewerSpec(specPage: SpecPage): Promise<Viewer>;
async function createViewerSpec(html: string): Promise<Viewer>;
async function createViewerSpec(arg: any): Promise<Viewer> {
  const page = typeof arg === 'string' ? await createViewerPage(arg) : arg;

  return page.rootInstance as Viewer;
}
