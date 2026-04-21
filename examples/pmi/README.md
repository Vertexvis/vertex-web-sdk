# PMI Example

This example defaults to loading `@vertexvis/viewer` from the CDN.

To test in-development changes from this repository instead:

1. Open [index.html](./index.html).
2. In the `<head>`, comment out the `Default` CDN asset block.
3. Uncomment the `Local development` asset block directly below it.
4. Start a local viewer build/watch process:

```bash
yarn workspace @vertexvis/viewer build
```

5. Start the examples dev server:

```bash
yarn examples:start
```

6. Open the example from that server:

```text
http://localhost:8080/examples/pmi/
```

Notes:

- The examples dev server now uses Vite and serves the repository root, so local asset paths like `/packages/viewer/dist/...` work directly.
- The local-development block should point to `/packages/viewer/dist/viewer/viewer.esm.js` so it mirrors the same browser bundle shape used by the CDN example.
- This PMI example only needs the HTML asset block switched. Its `main.js` does not import viewer modules from a CDN.
