jest.mock(
  '@vertexvis/scene-view-protos/sceneview/protos/scene_view_api_pb_service'
);
jest.mock('@vertexvis/stream-api');

import { SceneViewAPIClient } from '@vertexvis/scene-view-protos/sceneview/protos/scene_view_api_pb_service';
import { StreamApi } from '@vertexvis/stream-api';
import { UUID } from '@vertexvis/utils';

import { mockGrpcUnaryResult } from '../../../testing';
import { makeListItemModelViewsResponse } from '../../../testing/modelViews';
import { random } from '../../../testing/random';
import { ModelViewController } from '../controller';
import {
  mapItemModelViewOrThrow,
  mapListItemModelViewsResponseOrThrow,
} from '../mapper';

describe(ModelViewController, () => {
  const jwt = random.string();
  const deviceId = random.string();

  const sceneItemId = UUID.create();
  const modelViewId = UUID.create();
  const itemModelView = mapItemModelViewOrThrow({ modelViewId, sceneItemId });

  describe(ModelViewController.prototype.listByItem, () => {
    it('fetches page of model views', async () => {
      const { controller, client } = makeModelViewController(jwt, deviceId);
      const expected = makeListItemModelViewsResponse();

      (client.listItemModelViews as jest.Mock).mockImplementationOnce(
        mockGrpcUnaryResult(expected)
      );

      const res = await controller.listByItem(sceneItemId);
      expect(res).toEqual(
        mapListItemModelViewsResponseOrThrow(expected.toObject())
      );
    });
  });

  describe(ModelViewController.prototype.load, () => {
    it('updates the scene view with the provided model view id', async () => {
      const { controller, streamApi } = makeModelViewController(jwt, deviceId);

      (streamApi.updateModelView as jest.Mock).mockImplementationOnce(() =>
        Promise.resolve({})
      );

      await controller.load(sceneItemId, modelViewId);

      expect(streamApi.updateModelView).toHaveBeenCalledWith(
        expect.objectContaining({ itemModelView }),
        true
      );
    });
  });

  describe(ModelViewController.prototype.unload, () => {
    it('updates the scene view with an empty model view id and resets the scene', async () => {
      const { controller, streamApi } = makeModelViewController(jwt, deviceId);

      (streamApi.updateModelView as jest.Mock).mockImplementationOnce(() =>
        Promise.resolve({})
      );

      await controller.unload();

      expect(streamApi.updateModelView).toHaveBeenCalledWith({}, true);
    });
  });

  function makeModelViewController(
    jwt: string,
    deviceId: string
  ): {
    controller: ModelViewController;
    client: SceneViewAPIClient;
    streamApi: StreamApi;
  } {
    const client = new SceneViewAPIClient('https://example.com');
    const streamApi = new StreamApi();
    return {
      client,
      controller: new ModelViewController(
        client,
        streamApi,
        () => jwt,
        () => deviceId
      ),
      streamApi,
    };
  }
});
