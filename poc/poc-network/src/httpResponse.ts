import { HttpRequest } from './httpRequest';
import * as HttpHeaders from './httpHeaders';

export interface HttpResponse {
  request: HttpRequest;
  headers: HttpHeaders.HttpHeaders;
  status: number;
  body: string;
}

type Options = Pick<HttpResponse, 'request' | 'status'> &
  Partial<Pick<HttpResponse, 'headers' | 'body'>>;

export function fromXhr(
  request: HttpRequest,
  xhr: XMLHttpRequest
): HttpResponse {
  return create({
    request,
    headers: HttpHeaders.fromXhr(xhr),
    status: xhr.status,
    body: xhr.responseText,
  });
}

export function create(data: Options): HttpResponse {
  return {
    request: data.request,
    status: data.status,
    headers: data.headers || {},
    body: data.body || '',
  };
}
