import { vertexApiClient } from '../vertexApiClient';
import { HttpRequest, HttpResponse } from '@vertexvis/poc-network';
import { AuthToken } from '..';

describe(vertexApiClient, () => {
  const mockClient = (
    request: HttpRequest.HttpRequest
  ): Promise<HttpResponse.HttpResponse> => {
    return Promise.resolve({ request, headers: {}, status: 200, body: '' });
  };

  it('builds the correct URL', async () => {
    const client = vertexApiClient(
      () => ({ baseUrl: 'http://foo.com' }),
      mockClient
    );

    const request = HttpRequest.get({ url: '/foo' });
    const response = await client(request);
    expect(response.request.url).toEqual('http://foo.com/rest/api/foo');
  });

  it('adds authorization headers to request', async () => {
    const client = vertexApiClient(
      () => ({ baseUrl: '', auth: AuthToken.bearerToken('bearer-token') }),
      mockClient
    );

    const request = HttpRequest.get({ url: '/foo' });
    const response = await client(request);
    expect(response.request.headers).toMatchObject({
      Authorization: 'Bearer bearer-token',
    });
  });

  it('adds X-Correlation-Id header to request', async () => {
    const client = vertexApiClient(() => ({ baseUrl: '' }), mockClient);

    const request = HttpRequest.get({ url: '/foo' });
    const response = await client(request);
    expect(response.request.headers).toMatchObject({
      'X-Correlation-Id': expect.anything(),
    });
  });
});
