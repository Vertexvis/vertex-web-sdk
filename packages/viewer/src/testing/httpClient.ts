import { HttpRequest, HttpResponse } from '@vertexvis/network';

export function createHttpClientMock(
  responseBody?: object
): jest.Mock<any, any> {
  const request = HttpRequest.post({ url: '' });
  const response = HttpResponse.create({
    request,
    status: 200,
    body: responseBody ? JSON.stringify(responseBody) : '',
  });
  return jest.fn().mockResolvedValue(response);
}
