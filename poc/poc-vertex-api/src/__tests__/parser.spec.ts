import { parseResponse, parseJson } from '../parser';
import { HttpResponse, HttpRequest } from '@vertexvis/poc-network';

describe(parseResponse, () => {
  const body = JSON.stringify({ a: 1 });

  it('parses body if status code is 2xx', () => {
    const request = HttpRequest.get({ url: '/foo' });
    const response = HttpResponse.create({ request, status: 200, body });
    const result = parseResponse(response, parseJson);
    expect(result).toEqual({ a: 1 });
  });

  it('throws error if non-2xx status code', () => {
    const request = HttpRequest.get({ url: '/foo' });
    const response = HttpResponse.create({ request, status: 400, body });
    expect(() => parseResponse(response, parseJson)).toThrow();
  });
});
