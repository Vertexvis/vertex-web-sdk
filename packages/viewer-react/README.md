# React Bindings for Vertex Viewer SDK

![npm](https://img.shields.io/npm/v/@vertexvis/viewer-react)
![npm (scoped with tag)](https://img.shields.io/npm/v/@vertexvis/viewer-react/canary)

This project contains React bindings for Vertex's Viewer SDK. These bindings are
auto-generated from `@vertexvis/viewer`.

## Installation

Run `yarn add @vertexvis/viewer-react` or `npm install @vertexvis/viewer-react`
to add the project as an NPM dependency.

## Usage

The project includes a component loader, `defineCustomElements`, that needs to
be invoked in order for the elements to be loaded and rendered.

```jsx
import React from 'react';
import ReactDom from 'react-dom';
import { defineCustomElements } from '@vertexvis/viewer-react';

function main() {
  defineCustomElement(window);
  ReactDom.render(<App />, document.querySelector("#app"));
}

main();
```

If you plan on targeting IE11 or Edge <= 18, you'll also need to supply
polyfills for the Web Components APIs (Custom Elements, Shadow DOM, CSS
Variables, etc). To include the polyfills, import `applyPolyfills` from the
loader.

```jsx
import React from 'react';
import ReactDom from 'react-dom';
import { applyPolyfills, defineCustomElements } from '@vertexvis/viewer-react';

function main() {
  applyPolyfills().then(() => defineCustomElement(window));
  ReactDom.render(<App />, document.querySelector("#app"));
}

main();
```

Next, add one of the components to your React component.

```jsx
import React from 'react';
import { VertexViewer } from '@vertexvis/viewer-react';

export function App() {
  return (<div>
    <VertexViewer src="urn:vertexvis:stream-key:123" />
  </div>);
}
```

## Styles

The project includes a set of [global styles] that you should bundle as part of
your application. These styles define [CSS variables] that specify the default
component colors. You can override these variables to match your application's
branding.

If you're using a bundler like Webpack, import these styles from one of your JS
files.

```jsx
import '@vertexvis/viewer/dist/viewer/viewer.css';

export function MyApp() {
  return <div></div>;
}
```

Consult your bundler's documentation on approaches and best practices for
bundling CSS.

## Documentation

See [@vertexvis/viewer][component docs] for a full list of components and their
documentation.

[component docs]: https://github.com/Vertexvis/vertex-web-sdk/tree/master/packages/viewer/src/components
[css variables]: https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties
[global styles]: https://github.com/Vertexvis/vertex-web-sdk/blob/master/packages/viewer/src/css/global.css
