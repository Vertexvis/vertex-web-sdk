import { HttpClient } from './httpClient';
import * as HttpHeaders from './httpHeaders';
import * as HttpResponse from './httpResponse';
import { HttpRequestBody } from './httpRequestBody';
import { Objects } from '@vertexvis/utils';

type RequestFactory = () => XMLHttpRequest;

/**
 * Returns a `Client` that uses an `XMLHttpRequest` for networking requests.
 *
 * @param factory A function that returns an instance of an `XMLHttpRequest`.
 *  Useful for testing.
 */
export function httpWebClient(factory?: RequestFactory): HttpClient {
  return request => {
    return new Promise(resolve => {
      const req = factory != null ? factory() : new XMLHttpRequest();
      const headers = request.headers || {};

      req.open(request.method, request.url);

      HttpHeaders.addToXmlHttpRequest(req, headers);

      req.onload = () => resolve(HttpResponse.fromXhr(request, req));
      req.onerror = () => resolve(HttpResponse.fromXhr(request, req));

      if (request.body != null) {
        req.send(formatBody(headers['Content-Type'] || '', request.body));
      } else {
        req.send();
      }
    });
  };
}

function formatBody(contentType: string, body: HttpRequestBody): any {
  if (contentType.startsWith('application/json')) {
    return formatBodyAsJson(body);
  } else if (contentType.startsWith('application/x-www-form-urlencoded')) {
    return formatBodyAsForm(body);
  } else {
    return body;
  }
}

function formatBodyAsJson(body: HttpRequestBody): HttpRequestBody {
  if (typeof body !== 'string') {
    return JSON.stringify(body);
  } else {
    return body;
  }
}

function formatBodyAsForm(body: HttpRequestBody): HttpRequestBody {
  if (isPlainObject(body)) {
    return Objects.toPairs(body)
      .map(entry => entry.map(encodeURIComponent).join('='))
      .join('&');
  } else {
    return body;
  }
}

function isPlainObject(obj: any): obj is object {
  return Objects.isPlainObject(obj);
}
