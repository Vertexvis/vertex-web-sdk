<!-- DO NOT EDIT THE README.md DIRECTLY. THIS FILE IS AUTO-GENERATED. -->
<!-- INSTEAD EDIT README.template.md -->

![npm](https://img.shields.io/npm/v/@vertexvis/viewer)
![npm (scoped with tag)](https://img.shields.io/npm/v/@vertexvis/viewer/canary)

# Vertex Web Viewer SDK

This project contains Vertex's 3D Viewer SDK. Vertex is a cloud platform for
rendering large 3D models. See [Vertex's website][vertex] for more information.

Our 3D viewer is distributed as a set of standards-based [web components] that
can run in any browser supporting the Custom Elements v1 specification. For
browsers that do not support the Custom Elements v1 spec, a polyfill will
automatically be used.

## Getting Started

### Script Tag

The easiest way to get started is by including a `<script>` tag in your HTML
file that references our published JS bundles from a CDN.

```html
<html>
  <head>
    <link
      rel="stylesheet"
      href="https://unpkg.com/@vertexvis/viewer@{{version}}/dist/viewer/viewer.css"
    />
    <script
      type="module"
      src="https://unpkg.com/@vertexvis/viewer@{{version}}/dist/viewer/viewer.esm.js"
    ></script>
    <script
      nomodule
      src="https://unpkg.com/@vertexvis/viewer@{{version}}/dist/viewer.js"
    ></script>
  </head>

  <body>
    <vertex-viewer id="viewer" src="urn:vertexvis:stream-key:123" client-id="123"></vertex-viewer>
  </body>
</html>
```

---

This package also provides a set of utilities for use with its API.
These utilities can be imported from a CDN as shown below:

```html
<!-- CDN -->
<html>
  <head>
  </head>
  <body>
    <script type="module">
      import { ColorMaterial } from 'https://unpkg.com/@vertexvis/viewer@{{version}}/dist/esm/index.mjs';

      function main() {
        const color = ColorMaterial.fromHex('#ff0000');
      }
    </script>
  </body>
</html>
```

---

If you want to interact with the web component via JavaScript, you'll need to ensure the browser has registered the custom elements prior to use.

Import `defineCustomElements`, and this will register all custom elements in your DOM.
```js
import { defineCustomElements } from 'https://unpkg.com/@vertexvis/viewer@{{version}}/dist/esm/loader.mjs';

async function main() {
  const viewer = document.querySelector('#viewer');
  viewer.load("urn:vertexvis:stream-key:123")
}

window.addEventListener('DOMContentLoaded', () => {
  defineCustomElements(window).then(() => main());
});
```

### NPM Dependency

Our components can also be installed as an NPM dependency and imported through a
bundler such as Webpack or Rollup. First, add `@vertexvis/viewer` as an NPM
dependency to your `package.json`:

```json
{
  "dependencies": {
    "@vertexvis/viewer": "^{{version}}"
  }
}
```

Next, import `defineCustomElements` from the loader that is included as part of
the package. Calling the loader will analyze the components defined in your HTML
and load any components it finds. The returned promise will resolve once the
components are loaded.

```js
import { defineCustomElements } from '@vertexvis/viewer/loader';

async function main() {
  const viewer = document.querySelector("viewer");
  await viewer.load("urn:vertexvis:stream-key:123");
  console.log("Loaded!");
}

defineCustomElements(window).then(() => main());
```

If you plan on targeting IE11 or Edge <= 18, you'll also need to supply
polyfills for the Web Components APIs (Custom Elements, Shadow DOM, CSS
Variables, etc). To include the polyfills, import `applyPolyfills` from the
loader.

```js
import { applyPolyfills, defineCustomElements } from '@vertexvis/viewer/loader';

function main() {
  console.log("Loaded!");
}

applyPolyfills().then(() => defineCustomElements(window)).then(() => main());
```

## Examples

Check out our [examples] repository for more in-depth examples of how to use
Vertex's Viewer SDK.

[vertex]: https://www.vertexvis.com
[web components]: https://developer.mozilla.org/en-US/docs/Web/Web_Components
[examples]: https://github.com/Vertexvis/web-sdk-examples
