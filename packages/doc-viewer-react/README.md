# React Bindings for Vertex Document Viewer SDK

![npm](https://img.shields.io/npm/v/@vertexvis/doc-viewer-react)
![npm (scoped with tag)](https://img.shields.io/npm/v/@vertexvis/doc-viewer-react/canary)

This project contains React bindings for Vertex's Document Viewer SDK. These bindings are
auto-generated from `@vertexvis/doc-viewer`.

## Installation

Run `yarn add @vertexvis/doc-viewer-react` or `npm install @vertexvis/doc-viewer-react`
to add the project as an NPM dependency.

## Usage

`@vertexvis/doc-viewer` includes a component loader, `defineCustomElements`, that
needs to be invoked to register the components with the browser. It also
includes a global stylesheet with default styling. Consult your bundlers
documentation on how to bundle CSS with your project's bundler.

```jsx
import React from 'react';
import ReactDom from 'react-dom';

import { defineCustomElements } from '@vertexvis/doc-viewer/loader';
import '@vertexvis/doc-viewer/dist/doc-viewer/doc-viewer.css';

async function main() {
  await defineCustomElement(window);
  ReactDom.render(<App />, document.querySelector('#app'));
}

main();
```

Next, add one of the components to your React component.

```jsx
import React from 'react';
import { VertexDocumentViewer } from '@vertexvis/doc-viewer-react';

export function App() {
  return (
    <div>
      <VertexDocumentViewer src="https://{{ DOCUMENT_URL }}" />
    </div>
  );
}
```

## Documentation

See [@vertexvis/doc-viewer][component docs] for a full list of components and their
documentation.

[component docs]: https://github.com/Vertexvis/vertex-web-sdk/tree/master/packages/doc-viewer/src/components
[css variables]: https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties
[global styles]: https://github.com/Vertexvis/vertex-web-sdk/blob/master/packages/doc-viewer/src/css/global.css
