import { HttpRequestMethod } from './httpRequestMethod';
import { HttpHeaders } from './httpHeaders';
import { HttpRequestBody } from './httpRequestBody';

export interface HttpRequest {
  url: string;
  method: HttpRequestMethod;
  headers?: HttpHeaders;
  body?: HttpRequestBody;
}

type Options = Pick<HttpRequest, 'url' | 'headers' | 'body'>;

export function get(options: Options): HttpRequest {
  return { ...options, method: HttpRequestMethod.get };
}

export function post(options: Options): HttpRequest {
  return { ...options, method: HttpRequestMethod.post };
}

export function put(options: Options): HttpRequest {
  return { ...options, method: HttpRequestMethod.put };
}

export function patch(options: Options): HttpRequest {
  return { ...options, method: HttpRequestMethod.patch };
}

export function remove(options: Options): HttpRequest {
  return { ...options, method: HttpRequestMethod.delete };
}
