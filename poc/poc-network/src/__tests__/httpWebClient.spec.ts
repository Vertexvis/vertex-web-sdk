import { httpWebClient } from '../httpWebClient';
import { HttpRequest, post, get, put, patch } from '../httpRequest';
import xhrMock from 'xhr-mock';
import { HttpResponse } from '../httpResponse';

describe(httpWebClient, () => {
  beforeEach(() => xhrMock.setup());

  afterEach(() => xhrMock.teardown());

  it('should handle request with the method and url', async () => {
    xhrMock.get('/foo', (req, res) => res.status(200));
    const response = await fetchWith(
      get({
        url: '/foo',
      })
    );
    expect(response.status).toEqual(200);
  });

  it('should send a request with a body', async () => {
    const body = 'body';

    xhrMock.post('/foo', (req, res) => {
      expect(req.body()).toEqual(body);
      return res.status(200);
    });

    await fetchWith(
      post({
        url: '/foo',
        body,
      })
    );
  });

  it('should format body as JSON if content type is application/json', async () => {
    const body = { foo: 1 };

    xhrMock.post('/foo', (req, res) => {
      expect(req.body()).toEqual(JSON.stringify(body));
      return res.status(200);
    });

    await fetchWith(
      post({
        headers: { 'Content-Type': 'application/json' },
        url: '/foo',
        body,
      })
    );
  });

  it('should format body as form data if content type is application/x-www-form-urlencoded', async () => {
    const body = { a: 1, b: 2 };

    xhrMock.post('/foo', (req, res) => {
      expect(req.body()).toEqual('a=1&b=2');
      return res.status(200);
    });

    await fetchWith(
      post({
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        url: '/foo',
        body,
      })
    );
  });

  it('should add headers to the request', async () => {
    const headers = { foo: '1' };

    xhrMock.put('/foo', (req, res) => {
      expect(req.headers()).toMatchObject(headers);
      return res.status(200);
    });

    await fetchWith(
      put({
        url: '/foo',
        headers,
      })
    );
  });

  it('should return error response', async () => {
    xhrMock.error(() => undefined);
    xhrMock.patch('/foo', () => Promise.reject(new Error()));
    await fetchWith(patch({ url: '/foo' }));
  });
});

function fetchWith(request: HttpRequest): Promise<HttpResponse> {
  const fetch = httpWebClient();
  return fetch(request);
}
