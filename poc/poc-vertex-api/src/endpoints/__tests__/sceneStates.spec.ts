import * as SceneStates from '../sceneStates';
import { EndpointTest } from '../../__test-utils__/endpointTest';
import { HttpRequestMethod } from '@vertexvis/poc-network';

describe(SceneStates.create, () => {
  it('should make a POST request with the correct URL and body', () => {
    const request = { urn: 'urn', operations: [] };

    return new EndpointTest()
      .verifyRequest(HttpRequestMethod.post, '/scene_states', {
        id: request.urn,
        operations: request.operations,
      })
      .stubResponseBodyAsJson({ sceneStateId: 'scene-state-id' })
      .execute(client => SceneStates.create(client, request))
      .then(result => expect(result.sceneStateId).toEqual('scene-state-id'));
  });
});

describe(SceneStates.getForUserAndFile, () => {
  it('should make a GET request with the correct URL', () => {
    const fileId = 'file-id';

    return new EndpointTest()
      .verifyRequest(HttpRequestMethod.get, `/scene_states?fileId=${fileId}`)
      .stubResponseBodyAsJson({
        id: 'scene-state-id',
        sceneGraphId: 'scene-graph-id',
      })
      .execute(client => SceneStates.getForUserAndFile(client, fileId))
      .then(sceneState =>
        expect(sceneState).toEqual({
          id: 'scene-state-id',
          sceneGraphId: 'scene-graph-id',
        })
      );
  });
});
