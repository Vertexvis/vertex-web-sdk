jest.mock(
  '@vertexvis/scene-view-protos/sceneview/protos/scene_view_api_pb_service'
);

import { Dimensions, Point } from '@vertexvis/geometry';
import { SceneViewAPIClient } from '@vertexvis/scene-view-protos/sceneview/protos/scene_view_api_pb_service';
import { StreamApi } from '@vertexvis/stream-api';

import { mockGrpcUnaryResult } from '../../../testing';
import { makePerspectiveFrame } from '../../../testing/fixtures';
import {
  makeListItemModelViewsResponse,
  makeUpdateSceneViewRequest,
} from '../../../testing/modelViews';
import { random } from '../../../testing/random';
import { fromPbFrameOrThrow } from '../../mappers';
import { Scene } from '../../scenes';
import { Orientation } from '../../types';
import { ModelViewController } from '../controller';
import { mapListItemModelViewsResponseOrThrow } from '../mapper';

describe(ModelViewController, () => {
  const jwt = random.string();
  const deviceId = random.string();

  const sceneId = random.guid();
  const sceneViewId = random.guid();
  const itemId = random.guid();
  const modelViewId = random.guid();

  describe(ModelViewController.prototype.listByItem, () => {
    it('fetches page of model views', async () => {
      const { controller, client } = makeModelViewController(jwt, deviceId);
      const expected = makeListItemModelViewsResponse();

      (client.listItemModelViews as jest.Mock).mockImplementationOnce(
        mockGrpcUnaryResult(expected)
      );

      const res = await controller.listByItem(itemId);
      expect(res).toEqual(
        mapListItemModelViewsResponseOrThrow(expected.toObject())
      );
    });
  });

  describe(ModelViewController.prototype.load, () => {
    it('updates the scene view with the provided model view id', async () => {
      const { controller, client } = makeModelViewController(jwt, deviceId);
      const expected = makeUpdateSceneViewRequest(sceneViewId, modelViewId);

      (client.updateSceneView as jest.Mock).mockImplementationOnce(
        mockGrpcUnaryResult({})
      );

      await controller.load(modelViewId);

      expect(client.updateSceneView).toHaveBeenCalledWith(
        expected,
        expect.anything(),
        expect.any(Function)
      );
    });
  });

  describe(ModelViewController.prototype.unload, () => {
    it('updates the scene view with an empty model view id and resets the scene', async () => {
      const { controller, client, streamApi } = makeModelViewController(
        jwt,
        deviceId
      );
      const expected = makeUpdateSceneViewRequest(sceneViewId);

      (client.updateSceneView as jest.Mock).mockImplementationOnce(
        mockGrpcUnaryResult({})
      );
      streamApi.resetSceneView = jest.fn();

      await controller.unload();

      expect(client.updateSceneView).toHaveBeenCalledWith(
        expected,
        expect.anything(),
        expect.any(Function)
      );
      expect(streamApi.resetSceneView).toHaveBeenCalledWith(
        expect.objectContaining({
          includeCamera: true,
        }),
        true
      );
    });
  });

  function makeModelViewController(
    jwt: string,
    deviceId: string
  ): {
    controller: ModelViewController;
    client: SceneViewAPIClient;
    scene: Scene;
    streamApi: StreamApi;
  } {
    const client = new SceneViewAPIClient('https://example.com');
    const { scene, streamApi } = makeScene();
    return {
      client,
      controller: new ModelViewController(
        client,
        () => jwt,
        () => deviceId,
        () => Promise.resolve(scene)
      ),
      scene,
      streamApi,
    };
  }

  function makeScene(): {
    scene: Scene;
    streamApi: StreamApi;
  } {
    const streamApi = new StreamApi();

    return {
      scene: new Scene(
        streamApi,
        makePerspectiveFrame(),
        fromPbFrameOrThrow(Orientation.DEFAULT),
        () => Point.create(1, 1),
        Dimensions.create(50, 50),
        sceneId,
        sceneViewId
      ),
      streamApi,
    };
  }
});
