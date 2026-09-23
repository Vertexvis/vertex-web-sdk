# Vertex Web SDK guide

This Lerna monorepo contains Stencil 4 web components for 3D models and document
viewers. It also has packages for React and Vue bindings around those components,
and shared stream, geometry, and utility packages.

Inspect `git status` before editing and preserve unrelated changes.

## Find the source of behavior

- `packages/viewer/` contains the 3D components. Start with
  `src/components/viewer/viewer.tsx` for the main viewer. Its `src/lib/stream/`,
  `scenes/`, `interactions/`, and `rendering/` directories own the data flow
  from connection to frame drawing. `src/workers/` contains PNG worker code.
- `packages/stream-api/` owns WebSocket transport and protobuf message handling.
  Check `src/webSocketClient.ts`, `streamApi.ts`, and `connection.ts` for stream
  issues.
- `packages/doc-viewer/` contains document components, document state, and
  PDF.js integration.
- `packages/viewer-react/`, `viewer-vue/`, `doc-viewer-react/`, and
  `doc-viewer-vue/` provide framework bindings.
- `packages/geometry/`, `utils/`, and `html-templates/` provide shared
  libraries. `internal/build/` owns shared Rollup and declaration builds.

Trace the affected component, controller, transport, and event path before
editing. Reuse existing helpers and fix shared behavior at its source.

## Public contracts and generated files

- Preserve public props, methods, custom events and detail types, slots, CSS
  properties, and element refs. Keep registration, scene readiness, frame
  delivery, and connection events distinct. Check lifecycle behavior on load,
  unload, resize, visibility changes, and reconnect.
- Preserve package exports, ESM/CommonJS entrypoints, loaders, CSS, and worker
  assets. Avoid browser globals at module import time so utilities and package
  entrypoints remain usable in Node environments. Verify worker URLs in a
  browser for rendering or PDF changes.
- Preserve units, coordinate spaces, matrix conventions, protobuf optional
  values, and identifier meanings. Use an explicitly intended environment for
  live network checks; never commit or log real stream keys or tokens.
- Edit Stencil source and package exports, then rebuild the affected package.
  The Stencil configs generate React/Vue bindings in `src/generated/`; do not
  hand-edit them.
  `src/components.d.ts` is generated and tracked in both Stencil packages, so
  review its diff after public API changes.
- Component README API sections are generated from source. For package docs
  with `README.template.md`, edit the template. Do not commit ignored `dist/`,
  `loader/`, or generated binding output to solve a source or packaging issue.

Build shared libraries before their dependents and core Stencil packages before
framework bindings. For compatibility changes, check published API and package
versions as well as this workspace's examples; do not assume a local checkout
matches a consumer's installed version.

## Validation

Run from the repository root. Use nearby `*.spec.ts(x)` or `*.test.ts` tests and
existing test helpers for focused regression coverage.

```sh
yarn build
yarn workspace @vertexvis/viewer test --runInBand src/components/viewer/viewer.spec.tsx
yarn workspace @vertexvis/viewer lint
yarn typecheck:spec
yarn test:ci
yarn lint
```

Check that a copied test path exists before using it. Library packages use Jest;
Stencil packages use `stencil test --spec`. Root `yarn validate` runs build,
tests, and lint, but not the separate spec typecheck or SSR import checks. For
entrypoint or packaging changes, run the affected package's `test:ssr-import`.

Yarn 4 does not automatically run arbitrary `prebuild` and `postbuild` scripts.
For document-viewer packaging, run its `prebuild`, `build`, and `postbuild`
explicitly and inspect the resulting worker and entrypoint assets. Missing or
stale built workspace output can cause test failures without a source defect.

For visual, interaction, worker, or rendering changes, check a browser example
against local build output. `yarn examples:start` serves on port 8088; some
examples import published CDN builds until pointed at local output. Format only
touched files; root `yarn format` rewrites the repository. Report checks run and
any remaining browser or package validation.

Release scripts and pushes to `publish-testing` can publish packages or create
remote branches through CI. Run them only when the task authorizes publication.
