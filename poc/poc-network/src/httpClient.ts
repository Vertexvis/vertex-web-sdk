import { HttpRequest } from './httpRequest';
import { HttpResponse } from './httpResponse';

/**
 * A function that invokes a network request.
 *
 * Requests are treated as simple functions that return a `Promise`. This makes
 * it easy to compose different behavior together.
 *
 * @example
 *
 * // Making a networking request
 *
 * const fetch = httpWebClient();
 * const request = { method: HttpRequestMethod.post, url: 'http://foo.com', body: "hi" };
 * fetch(request).then(response => console.log(response.body));
 *
 * @example
 *
 * // Composing requests
 *
 * const delay = (seconds: number, fetch: HttpClient): HttpClient => {
 *   return request => {
 *     return new Promise(resolve => {
 *       setTimeout(() => fetch(request).then(resolve), seconds);
 *     })
 *   }
 * }
 * const delayedFetch = delay(1000, httpWebClient());
 * const request = { method: HttpRequestMethod.post, url: 'http://foo.com', body: "hi" };
 * delayedRequest(request);
 */
export type HttpClient = (request: HttpRequest) => Promise<HttpResponse>;
