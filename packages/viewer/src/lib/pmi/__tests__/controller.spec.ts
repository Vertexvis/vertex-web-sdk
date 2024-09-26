jest.mock(
  '@vertexvis/scene-view-protos/sceneview/protos/scene_view_api_pb_service'
);

import { SceneViewAPIClient } from '@vertexvis/scene-view-protos/sceneview/protos/scene_view_api_pb_service';

import { mockGrpcUnaryResult, random } from '../../../testing';
import { makeListPmiAnnotationsResponse } from '../../../testing/pmi';
import { PmiController } from '../controller';
import { mapListPmiAnnotationsResponseOrThrow } from '../mapper';

describe(PmiController, () => {
  const jwt = random.string();
  const deviceId = random.string();

  describe(PmiController.prototype.listAnnotations, () => {
    it('fetches page of annotations', async () => {
      const { controller, client } = makePmiController(jwt, deviceId);
      const expected = makeListPmiAnnotationsResponse();

      (client.listPmiAnnotations as jest.Mock).mockImplementationOnce(
        mockGrpcUnaryResult(expected)
      );

      const res = await controller.listAnnotations();
      expect(res).toEqual(
        mapListPmiAnnotationsResponseOrThrow(expected.toObject())
      );
    });
  });

  function makePmiController(
    jwt: string,
    deviceId: string
  ): {
    controller: PmiController;
    client: SceneViewAPIClient;
  } {
    const client = new SceneViewAPIClient('https://example.com');
    return {
      client,
      controller: new PmiController(
        client,
        () => jwt,
        () => deviceId
      ),
    };
  }
});
