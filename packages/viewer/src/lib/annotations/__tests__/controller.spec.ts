jest.mock(
  '@vertexvis/scene-view-protos/sceneview/protos/scene_view_api_pb_service'
);

import { SceneViewAPIClient } from '@vertexvis/scene-view-protos/sceneview/protos/scene_view_api_pb_service';
import { Async, UUID } from '@vertexvis/utils';

import { mockGrpcUnaryResult, random } from '../../../testing';
import {
  makeCreateSceneViewAnnotationSetResponse,
  makeDeleteSceneViewAnnotationSetResponse,
  makeListSceneAnnotationsResponse,
  makeListSceneViewAnnotationSetsResponse,
  makeSceneAnnotation,
  makeSceneAnnotationSet,
} from '../../../testing/annotations';
import { fromPbAnnotationOrThrow } from '../../mappers/annotation';
import { AnnotationController, AnnotationState } from '../controller';

describe(AnnotationController, () => {
  const jwt = random.string();
  const deviceId = random.string();

  const setId = UUID.create();

  describe(AnnotationController.prototype.addAnnotationSet, () => {
    it('calls API to add annotation set to view and emit state change', async () => {
      const { controller, client } = makeAnnotationController(jwt, deviceId);

      const expected = mockFetchAnnotationState(client);
      (client.createSceneViewAnnotationSet as jest.Mock).mockImplementationOnce(
        mockGrpcUnaryResult(makeCreateSceneViewAnnotationSetResponse())
      );

      const onStateChange = jest.fn();
      controller.onStateChange.on(onStateChange);

      const res = await controller.addAnnotationSet(setId);
      expect(res).toEqual(expected);
      expect(onStateChange).toHaveBeenCalledWith(expected);
    });
  });

  describe(AnnotationController.prototype.connect, () => {
    it('polls for updated annotation state until disconnected', async () => {
      const { controller, client } = makeAnnotationController(jwt, deviceId);

      function wait(): {
        promise: Promise<unknown>;
        callback: (v: unknown) => void;
      } {
        let resolve: ((v: unknown) => unknown) | undefined = undefined;
        const callback = jest.fn((v) => resolve?.(v));
        const promise = new Promise((r) => (resolve = r));
        return { callback, promise };
      }

      const wait1 = wait();
      let expected = mockFetchAnnotationState(client);
      controller.onStateChange.on(wait1.callback);
      controller.connect(15);
      await wait1.promise;
      expect(wait1.callback).toHaveBeenCalledWith(expected);

      const wait2 = wait();
      expected = mockFetchAnnotationState(client);
      controller.onStateChange.on(wait2.callback);
      await wait2.promise;
      expect(wait2.callback).toHaveBeenCalledWith(expected);

      const wait3 = wait();
      expected = mockFetchAnnotationState(client);
      controller.onStateChange.on(wait3.callback);
      await wait3.promise;
      expect(wait3.callback).toHaveBeenCalledWith(expected);

      const wait4 = wait();
      mockFetchAnnotationState(client);
      controller.disconnect();
      await Async.delay(50);
      expect(wait4.callback).not.toHaveBeenCalled();
    });
  });

  describe(AnnotationController.prototype.fetch, () => {
    it('calls API to retrieve annotation state', async () => {
      const { controller, client } = makeAnnotationController(jwt, deviceId);

      const expected = mockFetchAnnotationState(client);
      const onStateChange = jest.fn();
      controller.onStateChange.on(onStateChange);

      const res = await controller.fetch();
      expect(res).toEqual(expected);
      expect(onStateChange).toHaveBeenCalledWith(expected);
    });
  });

  describe(AnnotationController.prototype.removeAnnotationSet, () => {
    it('calls API to add annotation set to view and emit state change', async () => {
      const { controller, client } = makeAnnotationController(jwt, deviceId);

      const expected = mockFetchAnnotationState(client);
      (client.deleteSceneViewAnnotationSet as jest.Mock).mockImplementationOnce(
        mockGrpcUnaryResult(makeDeleteSceneViewAnnotationSetResponse())
      );

      const onStateChange = jest.fn();
      controller.onStateChange.on(onStateChange);

      const res = await controller.removeAnnotationSet(setId);
      expect(res).toEqual(expected);
      expect(onStateChange).toHaveBeenCalledWith(expected);
    });
  });
});

function makeAnnotationController(
  jwt: string,
  deviceId: string
): { controller: AnnotationController; client: SceneViewAPIClient } {
  const client = new SceneViewAPIClient('https://example.com');
  return {
    client,
    controller: new AnnotationController(
      client,
      () => jwt,
      () => deviceId
    ),
  };
}

function mockFetchAnnotationState(client: SceneViewAPIClient): AnnotationState {
  const setId1 = UUID.create();
  const setId2 = UUID.create();
  const annId1 = UUID.create();
  const annId2 = UUID.create();

  const annotationSets = [
    makeSceneAnnotationSet({ id: setId1 }),
    makeSceneAnnotationSet({ id: setId2 }),
  ];
  const ann1 = makeSceneAnnotation({ id: annId1 });
  const ann2 = makeSceneAnnotation({ id: annId2 });

  (client.listSceneViewAnnotationSets as jest.Mock).mockImplementationOnce(
    mockGrpcUnaryResult(makeListSceneViewAnnotationSetsResponse(annotationSets))
  );
  (client.listSceneAnnotations as jest.Mock)
    .mockImplementationOnce(
      mockGrpcUnaryResult(makeListSceneAnnotationsResponse([ann1]))
    )
    .mockImplementationOnce(
      mockGrpcUnaryResult(makeListSceneAnnotationsResponse([ann2]))
    );

  return {
    annotations: {
      [setId1]: [fromPbAnnotationOrThrow(ann1)],
      [setId2]: [fromPbAnnotationOrThrow(ann2)],
    },
  };
}
