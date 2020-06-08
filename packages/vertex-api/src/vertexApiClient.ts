import { HttpClient, HttpRequest } from '@vertexvis/network';
import { UUID, Uri } from '@vertexvis/utils';
import * as AuthToken from './authToken';

export interface VertexApiOptions {
  baseUrl: string;
  auth?: AuthToken.AuthToken;
}

export function vertexApiClient(
  optionsProvider: () => VertexApiOptions,
  client: HttpClient.HttpClient
): HttpClient.HttpClient {
  return request => {
    const options = optionsProvider();
    const newRequest = createRequest(options, request);
    return client(newRequest);
  };
}

function createRequest(
  options: VertexApiOptions,
  request: HttpRequest.HttpRequest
): HttpRequest.HttpRequest {
  const { baseUrl, auth } = options;
  const correlationId = UUID.create();
  const requestUri = Uri.parse(request.url);
  const uri = Uri.addQueryEntries(
    Uri.queryAsArray(requestUri),
    Uri.appendPath(
      requestUri.path || '',
      Uri.appendPath('/rest/api', Uri.parse(baseUrl))
    )
  );

  const authHeaders = auth != null ? AuthToken.appendToHeaders({}, auth) : {};
  const headers = {
    'X-Correlation-Id': correlationId,
    'Content-Type': 'application/json',
    ...authHeaders,
    ...request.headers,
  };

  return { ...request, body: request.body, headers, url: Uri.toString(uri) };
}
