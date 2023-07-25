# React Bindings for Vertex Viewer SDK

![npm](https://img.shields.io/npm/v/@vertexvis/viewer-react)
![npm (scoped with tag)](https://img.shields.io/npm/v/@vertexvis/viewer-react/canary)

This project contains React bindings for Vertex's Viewer SDK. These bindings are
auto-generated from `@vertexvis/viewer`.

## Installation

Run `yarn add @vertexvis/viewer-react` or `npm install @vertexvis/viewer-react`
to add the project as an NPM dependency.

## Usage

`@vertexvis/viewer` includes a component loader, `defineCustomElements`, that
needs to be invoked to register the components with the browser. It also
includes a global stylesheet with default styling. Consult your bundlers
documentation on how to bundle CSS with your project's bundler.

```jsx
import React from 'react';
import ReactDom from 'react-dom';

import { defineCustomElements } from '@vertexvis/viewer/loader';
import '@vertexvis/viewer/dist/viewer/viewer.css';

async function main() {
  await defineCustomElement(window);
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
    <VertexViewer src="urn:vertex:stream-key:123" />
  </div>);
}
```

## Documentation

See [@vertexvis/viewer][component docs] for a full list of components and their
documentation.

[component docs]: https://github.com/Vertexvis/vertex-web-sdk/tree/master/packages/viewer/src/components
[css variables]: https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties
[global styles]: https://github.com/Vertexvis/vertex-web-sdk/blob/master/packages/viewer/src/css/global.css
