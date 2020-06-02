import { BoundingBox, Dimensions, Vector3, Point } from '@vertexvis/geometry';
import { Camera, Scene as GraphicsScene } from '@vertexvis/graphics3d';
import { HttpRequest, HttpResponse } from '@vertexvis/network';
import { AuthToken } from '@vertexvis/vertex-api';
import { CommandRegistry } from '../../commands/commandRegistry';
import { defaultConfig } from '../../config/config';
import { ImageStreamingClient } from '../../image-streaming-client';
import { WebSocketClient } from '../../websocket-client';
import { httpBulkBomOperationExecutor, Scene } from '../scene';
import { SelectorBuilder } from '../selectors';
import { Disposable } from '../../utils';

describe(Scene, () => {
  const executor = jest.fn().mockReturnValue(Promise.resolve());
  const pickExecutor = jest.fn().mockReturnValue(Promise.resolve());
  const commands = new CommandRegistry(
    new ImageStreamingClient(new WebSocketClient()),
    jest.fn(),
    () => defaultConfig,
    () => AuthToken.unauthorized()
  );
  const selector = (selector: SelectorBuilder<any>): SelectorBuilder<any> =>
    selector.withItemId('item-id');
  const scene = new Scene(executor, pickExecutor, commands, () => ({
    scene: GraphicsScene.create(Camera.create(), Dimensions.create(100, 50)),
    visibleBoundingBox: BoundingBox.create(
      Vector3.create(-1, -1, -1),
      Vector3.create(1, 1, 1)
    ),
  }));

  beforeEach(() => executor.mockReset());

  describe(Scene.prototype.raycaster, () => {
    it('uses a position selector for any operation used alongside it', async () => {
      const raycaster = await scene.raycaster();
      await raycaster
        .intersectItems(Point.create(0, 0))
        .show()
        .execute();
      expect(executor).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            selector: expect.objectContaining({ type: 'position' }),
          }),
        ])
      );
    });
  });

  describe(Scene.prototype.clearAllHighlights, () => {
    it('creates a clear highlight operation', async () => {
      await scene.clearAllHighlights().execute();
      expect(executor).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            operation: { type: 'clear_highlight_all' },
          }),
        ])
      );
    });
  });

  describe(Scene.prototype.showAll, () => {
    it('creates a show all operation', async () => {
      await scene.showAll().execute();
      expect(executor).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            operation: { type: 'show_all' },
          }),
        ])
      );
    });
  });

  describe(Scene.prototype.hideAll, () => {
    it('creates a show all operation', async () => {
      await scene.hideAll().execute();
      expect(executor).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            operation: { type: 'hide_all' },
          }),
        ])
      );
    });
  });

  describe(Scene.prototype.hide, () => {
    it('creates a hide operation', async () => {
      await scene.hide(selector).execute();

      expect(executor).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            operation: { type: 'hide' },
          }),
        ])
      );
    });
  });

  describe(Scene.prototype.highlight, () => {
    it('creates a highlight operation', async () => {
      await scene.highlight('#ff0000', selector).execute();

      expect(executor).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            operation: expect.objectContaining({ type: 'highlight' }),
          }),
        ])
      );
    });
  });

  describe(Scene.prototype.show, () => {
    it('creates a show operation', async () => {
      await scene.show(selector).execute();

      expect(executor).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            operation: expect.objectContaining({ type: 'show' }),
          }),
        ])
      );
    });
  });

  describe(Scene.prototype.showOnly, () => {
    it('creates a show only operation', async () => {
      await scene.showOnly(selector).execute();

      expect(executor).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            operation: expect.objectContaining({ type: 'show_only' }),
          }),
        ])
      );
    });
  });

  describe(Scene.prototype.camera, () => {
    const replaceCamera = jest.fn().mockReturnValue(() => undefined);
    let disposable: Disposable;

    beforeEach(() => {
      replaceCamera.mockClear();

      disposable = commands.register('stream.replace-camera', replaceCamera);
    });

    afterEach(() => disposable.dispose());

    it('lookAt() updates the camera look at position', async () => {
      try {
        await scene
          .camera()
          .lookAt(Vector3.right())
          .execute();
        expect(replaceCamera).toHaveBeenCalledWith(
          expect.objectContaining({ lookat: Vector3.right() })
        );
      } finally {
        disposable.dispose();
      }
    });

    it('position() updates the camera position', async () => {
      try {
        await scene
          .camera()
          .position(Vector3.right())
          .execute();
        expect(replaceCamera).toHaveBeenCalledWith(
          expect.objectContaining({ position: Vector3.right() })
        );
      } finally {
        disposable.dispose();
      }
    });

    it('up() updates the camera up vector', async () => {
      try {
        await scene
          .camera()
          .up(Vector3.right())
          .execute();
        expect(replaceCamera).toHaveBeenCalledWith(
          expect.objectContaining({ upvector: Vector3.right() })
        );
      } finally {
        disposable.dispose();
      }
    });

    it('set() updates camera with given data', async () => {
      try {
        await scene
          .camera()
          .set({
            position: Vector3.left(),
            upvector: Vector3.down(),
            lookat: Vector3.right(),
          })
          .execute();
        expect(replaceCamera).toHaveBeenCalledWith(
          expect.objectContaining({
            position: Vector3.left(),
            upvector: Vector3.down(),
            lookat: Vector3.right(),
          })
        );
      } finally {
        disposable.dispose();
      }
    });

    it('viewAll() updates the camera position to view all parts', async () => {
      const replaceCamera = jest.fn();
      const disposable = commands.register(
        'stream.replace-camera',
        () => replaceCamera
      );

      try {
        await scene
          .camera()
          .viewAll()
          .execute();
        expect(replaceCamera).toHaveBeenCalled();
      } finally {
        disposable.dispose();
      }
    });
  });
});

describe(httpBulkBomOperationExecutor, () => {
  const request = HttpRequest.post({ url: '' });
  const response = HttpResponse.create({
    request,
    status: 200,
    body: JSON.stringify({ sceneStateId: 'scene-state-id' }),
  });
  const httpClient = jest.fn();

  beforeEach(() => httpClient.mockReset());

  it('performs a create scene state request', async () => {
    httpClient.mockResolvedValue(response);

    const executor = httpBulkBomOperationExecutor(
      () => httpClient,
      'scene-state-id'
    );
    await executor([]);

    expect(httpClient).toHaveBeenCalledWith(
      expect.objectContaining({
        body: { operations: [] },
      })
    );
  });
});
