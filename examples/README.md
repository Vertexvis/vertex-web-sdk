# Examples

Examples default to loading resources from CDNs. To test or experiment with local resources instead:

1. Open [index.html](./examples/pmi/index.html).
2. Change urls that point to CDNs to point to local packages instead. most of these will be in the `<head>` but some might be in .js files too.
4. Start a local viewer build/watch process:

``` sh
yarn workspace @vertexvis/viewer start
```

5. Serve the repository root so `/packages/viewer/dist/...` is reachable:

``` sh
yarn examples:start:local
```

6. Open the example from that server:

``` 
http://localhost:8080/examples/pmi/
```

Notes:

- `yarn examples:start` serves only the `examples/` directory, so it will not expose `/packages/viewer/dist/...`. Use `yarn examples:start:local` for the local-assets flow.
