<!-- DO NOT EDIT THE README.md DIRECTLY. THIS FILE IS AUTO-GENERATED. -->
<!-- INSTEAD EDIT README.template.md -->

![Built With Stencil](https://img.shields.io/badge/-Built%20With%20Stencil-16161d.svg?logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDE5LjIuMSwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPgo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IgoJIHZpZXdCb3g9IjAgMCA1MTIgNTEyIiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCA1MTIgNTEyOyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI%2BCjxzdHlsZSB0eXBlPSJ0ZXh0L2NzcyI%2BCgkuc3Qwe2ZpbGw6I0ZGRkZGRjt9Cjwvc3R5bGU%2BCjxwYXRoIGNsYXNzPSJzdDAiIGQ9Ik00MjQuNywzNzMuOWMwLDM3LjYtNTUuMSw2OC42LTkyLjcsNjguNkgxODAuNGMtMzcuOSwwLTkyLjctMzAuNy05Mi43LTY4LjZ2LTMuNmgzMzYuOVYzNzMuOXoiLz4KPHBhdGggY2xhc3M9InN0MCIgZD0iTTQyNC43LDI5Mi4xSDE4MC40Yy0zNy42LDAtOTIuNy0zMS05Mi43LTY4LjZ2LTMuNkgzMzJjMzcuNiwwLDkyLjcsMzEsOTIuNyw2OC42VjI5Mi4xeiIvPgo8cGF0aCBjbGFzcz0ic3QwIiBkPSJNNDI0LjcsMTQxLjdIODcuN3YtMy42YzAtMzcuNiw1NC44LTY4LjYsOTIuNy02OC42SDMzMmMzNy45LDAsOTIuNywzMC43LDkyLjcsNjguNlYxNDEuN3oiLz4KPC9zdmc%2BCg%3D%3D&colorA=16161d&style=flat-square)
![npm](https://img.shields.io/npm/v/@vertexvis/viewer)
![npm (scoped with tag)](https://img.shields.io/npm/v/@vertexvis/viewer/canary)

# Vertex Web Viewer SDK

This project contains Vertex's 3D Viewer SDK. Vertex is a cloud platform for
rendering large 3D models. See [Vertex's website][vertex] for more information.

Our 3D viewer is distributed as a set of standards-based [web components] that
can run in any browser supporting the Custom Elements v1 specification. For
browsers that do not support the Custom Elements v1 spec, a polyfill will
automatically be used.

## Installation

### Script Tag

The easiest way to get started is by including a `<script>` tag in your HTML
file that references our published JS bundles from a CDN.

```html
<html>
  <head>
    <link
      rel="stylesheet"
      href="https://unpkg.com/@vertexvis/viewer@0.16.0/dist/viewer/viewer.css"
    />
    <script
      type="module"
      src="https://unpkg.com/@vertexvis/viewer@0.16.0/dist/viewer/viewer.esm.js"
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
      import { ColorMaterial } from 'https://unpkg.com/@vertexvis/viewer@0.16.0/dist/esm/index.mjs';

      function main() {
        const color = ColorMaterial.fromHex('#ff0000');
      }
    </script>
  </body>
</html>
```

---

If you want to interact with a web component via JavaScript, you should ensure
the browser has registered the custom elements prior to calling the elements
methods. You can use
[`window.customElements.whenDefined`](https://developer.mozilla.org/en-US/docs/Web/API/CustomElementRegistry/whenDefined)
to check if the component has been loaded.

```js
async function main() {
  const viewer = document.querySelector('#viewer');

  // Wait for the component to be registered.
  await customElements.whenDefined('vertex-viewer');
  viewer.load("urn:vertexvis:stream-key:123")
}
```

### NPM Dependency

Our components support being installed as an NPM dependency and packaged through
a bundler such as Webpack or Rollup. First, add `@vertexvis/viewer` as an NPM
dependency to your `package.json`:

```json
{
  "dependencies": {
    "@vertexvis/viewer": "^0.16.0"
  }
}
```

Next, import `defineCustomElements` from the loader included as part of the
package. Using the loader will self lazy-load the components used in your
application.

**Note:** Certain bundler settings may have issues with using the self
lazy-loading strategy. See [Manually Registering
Components](#manually-registering-components) for an alternative to register
components.

```js
import { defineCustomElements } from '@vertexvis/viewer/loader';

async function main() {
  await defineCustomElements();

  const viewer = document.querySelector("viewer");
  await viewer.load("urn:vertexvis:stream-key:123");
  console.log("Loaded!");
}

main();
```

## Manually Registering Components

We recommended using self lazy-loading to load components, which helps keep
bundle sizes to a minimum and only loads components as they're needed. However,
some bundler configurations may have problems with this option.

You can manually register components by importing them and registering them
with the browser.

```js
import { VertexViewer, VertexViewerDefaultToolbar } from '@vertexvis/viewer';

customElements.define('vertex-viewer', VertexViewer);
customElements.define('vertex-viewer-default-toolbar', VertexViewerDefaultToolbar);
```

If a component depends on other components, you'll need to register each one
individually. As this can be tedious, we export a `defineCustomElements()`
method to register all components. **Note:** this will add all components to
your bundle.

```js
import { defineCustomElements } from '@vertexvis/viewer';

defineCustomElements();
```

## Polyfills

If you plan on targeting IE11 or Edge <= 18, you'll also need to supply
polyfills for the Web Component APIs (Custom Elements, Shadow DOM, CSS
Variables, etc).

To include the polyfills, import `applyPolyfills` from the loader.

```js
import { applyPolyfills, defineCustomElements } from '@vertexvis/viewer/loader';

function main() {
  await applyPolyfills();
  await defineCustomElements();

  console.log("Loaded!");
}
```

## Examples

Check out our [examples](../../examples) directory and
[Examples](https://developer.vertexvis.com/examples) page on our Dev Portal to
get an idea of what you can do with Vertex's Viewer component.

[vertex]: https://www.vertexvis.com
[web components]: https://developer.mozilla.org/en-US/docs/Web/Web_Components
