import * as HitDetection from '../hitDetection';
import { HttpRequestMethod } from '@vertexvis/network';
import { Point, Dimensions, Vector3 } from '@vertexvis/geometry';
import { HitResult } from '../../types';
import { EndpointTest } from '../../__test-utils__/endpointTest';
import { Camera } from '@vertexvis/graphics3d';

describe(HitDetection.getHitsByPixel, () => {
  it('does a POST request to the correct url', () => {
    const body = {
      sceneGraphId: 'scene-graph-id',
      position: Point.create(),
      viewport: Dimensions.create(200, 100),
      camera: Camera.create(),
    };

    return new EndpointTest()
      .verifyRequest(HttpRequestMethod.post, `/scene_states/123/hits_by_pixel`)
      .stubResponseBodyAsJson([toHitResultResponseJson(HitResult.create())])
      .execute(client => HitDetection.getHitsByPixel(client, '123', body))
      .then(hits => expect(hits).toHaveLength(1));
  });
});

function toHitResultResponseJson(hitResult: HitResult.HitResult): object {
  return {
    ...hitResult,
    position: { array: Vector3.toArray(hitResult.position) },
    normal: { array: Vector3.toArray(hitResult.normal) },
  };
}
