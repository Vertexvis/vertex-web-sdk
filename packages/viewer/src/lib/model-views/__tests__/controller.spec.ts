jest.mock(
  '@vertexvis/scene-view-protos/sceneview/protos/scene_view_api_pb_service'
);

import { SceneViewAPIClient } from '@vertexvis/scene-view-protos/sceneview/protos/scene_view_api_pb_service';
import { ModelViewController } from '../controller';
import { random } from '../../../testing/random';
import { mockGrpcUnaryResult } from '../../../testing';
import { makeListItemModelViewsResponse } from '../../../testing/modelViews';

describe(ModelViewController, () => {
  const jwt = random.string();
  const deviceId = random.string();

  const itemId = random.guid();

  describe(ModelViewController.prototype.listByItem, () => {
    it('fetches page of model views', async () => {
      const { controller, client } = makeAnnotationController(jwt, deviceId);
      const expected = makeListItemModelViewsResponse();

      (client.listItemModelViews as jest.Mock).mockImplementationOnce(
        mockGrpcUnaryResult(expected)
      );

      const res = await controller.listByItem(itemId);
      expect(res).toEqual(expected.toObject());
    });
  });

  function makeAnnotationController(
    jwt: string,
    deviceId: string
  ): { controller: ModelViewController; client: SceneViewAPIClient } {
    const client = new SceneViewAPIClient('https://example.com');
    return {
      client,
      controller: new ModelViewController(
        client,
        () => jwt,
        () => deviceId
      ),
    };
  }
});
