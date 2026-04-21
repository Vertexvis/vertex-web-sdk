# Examples

Examples default to loading resources from CDNs. To test or experiment with local resources instead:

1. Open an example such as [pmi/index.html](./pmi/index.html).
2. Change URLs that point to CDNs to point to local package assets instead. Most of these will be in the `<head>`, but some examples also import SDK modules directly from CDN URLs in `.js` files.
3. Start a local viewer build/watch process:

```sh
yarn workspace @vertexvis/viewer start
```

4. Start the examples dev server:

```sh
yarn examples:start
```

5. Open the example from that server:

```text
http://localhost:8080/examples/pmi/
```

Notes:

- `yarn examples:start` now serves the repository root through Vite, so `/packages/viewer/dist/...` is reachable during local development.
- Vite handles browser refresh automatically, so the examples no longer need hardcoded LiveReload script tags.
