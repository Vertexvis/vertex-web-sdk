# Examples

Examples default to loading resources from CDNs. To test or experiment with local resources instead:

1. Open an example such as [pmi/index.html](./pmi/index.html).
2. Change URLs that point to CDNs to point to local package assets instead. Most of these will be in the `<head>`, but some examples also import SDK modules directly from CDN URLs in `.js` files. Here is an example of the tags to replace 
``` html
<link rel="stylesheet" href="/packages/viewer/dist/viewer/viewer.css" />
<script type="module" src="/packages/viewer/dist/viewer/viewer.esm.js"></script>
```
3. Build a local package:

```sh
yarn workspace @vertexvis/viewer build
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

- `yarn examples:start` serves the repository root through Vite, so `/packages/viewer/dist/...` is reachable during local development.
- Vite handles browser refresh automatically, so the changes within examples should reload live, but changes within packages will need a fresh build with stencil in order to show up.
