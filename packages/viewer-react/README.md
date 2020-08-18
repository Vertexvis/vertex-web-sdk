# React Bindings for Vertex Viewer SDK

Project contains React bindings for Vertex's Viewer SDK. These bindings are
auto-generated from `@vertexvis/viewer`.

## Usage

Run `yarn add @vertexvis/viewer-react` or `npm install @vertexvis/viewer-react`
to add the project as an NPM dependency.

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

If you plan on targeting IE <= 11 or Edge <= 18, you'll also need to supply
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

## Documentation

See [@vertexvis/viewer](../viewer/src/components) for a full list of components
and their documentation.
