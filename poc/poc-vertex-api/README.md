# Vertex RESTful API Client

This NPM package contains an API client for interacting with Vertex's RESTful
API.

## Usage

Add `@vertexvis/poc-vertex-api` as an NPM dev dependency to your project. The
project depends on `@vertexvis/utils` for common helpers and
`@vertexvis/network` for its networking client. Your consuming project is
expected to include this as a dependency in your package.json file. If you're
building a shared library, consider making these peer dependency instead.

```json
// package.json
{
  "dependencies": {
    "@vertexvis/network": "0.0.0",
    "@vertexvis/utils": "0.0.0",
    "@vertexvis/poc-vertex-api": "0.0.0"
  }
}
```

## Examples

**Example:** Creating an API Client

```ts
import { httpWebClient, HitDetection } from '@vertexvis/network';
import { AuthToken } from '@vertexvis/poc-vertex-api';

const config = {
  baseUrl: 'https://dev.vertexvis.io',
  auth: AuthToken.bearerToken('token'),
};
const client = vertexApiClient(() => config, httpWebClient);

const hitResult = HitDetection.getHitsByPixel(client);
```
