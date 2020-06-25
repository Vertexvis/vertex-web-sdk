import * as Files from '../files';
import { EndpointTest } from '../../__test-utils__/endpointTest';
import { HttpRequestMethod } from '@vertexvis/network';

describe(Files.getFile, () => {
  it('does a GET request to the correct url', () => {
    const params = { externalId: 'external-id' };

    return new EndpointTest()
      .verifyRequest(
        HttpRequestMethod.get,
        `/filestore/file?external_id=external-id`
      )
      .stubResponseBodyAsJson({ id: '123', name: 'file' })
      .execute(client => Files.getFile(client, params))
      .then(file => expect(file).toEqual({ id: '123', name: 'file' }));
  });
});
