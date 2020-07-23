import { Viewer } from './viewer';
import { MouseInteractionHandler } from '../../interactions/mouseInteractionHandler';
import { newSpecPage, SpecPage } from '@stencil/core/testing';
import { TouchInteractionHandler } from '../../interactions/touchInteractionHandler';

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

  describe('resize', () => {
    it('calls the resize-stream command', async () => {
      const viewerPage = await createViewerPage(
        `<vertex-viewer></vertex-viewer`
      );
      const viewer = await createViewerSpec(viewerPage);
      const commandPromise = new Promise(resolve => {
        viewer.registerCommand('stream.resize-stream', dimensions => {
          return ({ stream }) => {
            resolve(dimensions);
          };
        });
      });
      await viewer.load('urn:vertexvis:scene:scene-id');

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

  describe(Viewer.prototype.load, () => {
    it('loads a scene with auth token and should start the stream.', async () => {
      const mockfn = jest.fn();
      const viewer = await createViewerSpec(
        `<vertex-viewer token="token"></vertex-viewer`
      );

      viewer.registerCommand('stream.start', () => () => {
        mockfn();
        return Promise.resolve({ sceneId: 'scene-id' });
      });

      await viewer.load('urn:vertexvis:scene:scene-id');

      expect(mockfn).toHaveBeenCalled();
    });

    it('throws exception if scene cannot be loaded', async () => {
      const viewer = await createViewerSpec(`<vertex-viewer></vertex-viewer`);
      const command = await viewer.registerCommand(
        'stream.connect',
        () => () => {
          throw 'oops';
        }
      );
      expect(viewer.load('urn:vertexvis:scene:scene-id')).rejects.toThrow();
      command.dispose();
    });
  });
});

async function createViewerPage(html: string): Promise<SpecPage> {
  const page = await newSpecPage({ components: [Viewer], html });
  const viewer = page.rootInstance as Viewer;

  viewer.registerCommand('stream.connect', () => () => Promise.resolve());
  viewer.registerCommand('stream.start', () => () =>
    Promise.resolve({ sceneId: 'scene-id' })
  );
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
