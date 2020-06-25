# Vertex Networking Library

This project contains a low level networking library that can be used by Vertex
JS projects. The library follows functional principles and uses function
composition as a means to extend the functionality provided by the base
networking clients.

## Usage

Add `@vertexvis/poc-network` as an NPM dev dependency to your project. The project
depends on `@vertexvis/utils` for common helpers, and your consuming project is
expected to include this as a dependency in your package.json file. If you're
building a shared library, consider making `@vertexvis/utils` a peer dependency
instead.

```json
// package.json
{
  "dependencies": {
    "@vertexvis/poc-network": "0.0.0",
    "@vertexvis/utils": "0.0.0"
  }
}
```

## Examples

**Example:** Making a simple network request

```js
import { httpWebClient, HttpRequestMethod } from '@vertexvis/poc-network';

const fetch = httpWebClient();
const request = {
  method: HttpRequestMethod.post,
  url: 'http://foo.com',
  body: 'hi',
};
fetch(request).then(response => console.log(response.body));
```

**Example:** Decorating a client

The networking client is simply a function that accepts a `HttpRequest` and returns an
async `HttpResponse`. You can use function composition to wrap a client to

```js
import {
  httpWebClient,
  HttpClient,
  HttpRequestMethod,
} from '@vertexvis/poc-network';

const delay = (seconds: number, fetch: HttpClient): HttpClient => {
  return request => {
    return new Promise(resolve => {
      setTimeout(() => fetch(request).then(resolve), seconds);
    });
  };
};

const delayedFetch = delay(1000, httpWebClient());
const request = {
  method: HttpRequestMethod.post,
  url: 'http://foo.com',
  body: 'hi',
};
delayedRequest(request);
```
