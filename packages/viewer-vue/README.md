# Vue Bindings for Vertex Viewer SDK

![npm](https://img.shields.io/npm/v/@vertexvis/viewer-vue)
![npm (scoped with tag)](https://img.shields.io/npm/v/@vertexvis/viewer-vue/canary)

This project contains Vue bindings for Vertex's Viewer SDK. These bindings are
auto-generated from `@vertexvis/viewer`.

## Installation

Run `yarn add @vertexvis/viewer-vue` or `npm install @vertexvis/viewer-vue`
to add the project as an NPM dependency.

## Usage

Prior to to use the component wrappers, we'll need to update the
`vite.config.ts` for the project to indicate that these wrappers are custom
elements. This will prevent warnings from Vue failing to resolve the custom
elements.

```typescript
// vite.config.ts

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.includes('vertex-')
        }
      }
    }),
    vueJsx()
  ]
});
```

Next, `@vertexvis/viewer-vue` includes a Vue [Plugin][vue plugins], 
`VertexViewerPlugin`, that needs to be added to the Vue App. It also
includes a global stylesheet with default styling. Consult your bundler's
documentation on how to bundle CSS with your project's bundler.

```jsx
import '@vertexvis/viewer/dist/viewer/viewer.css';

import { createApp } from 'vue';
import { VertexViewerPlugin } from '@vertexvis/viewer-vue';
import App from './App.vue';

createApp(App).use(VertexViewerPlugin).mount('#app');
```

Lastly, use the component wrappers in one of your Vue components.

```jsx
<template>
  <vertex-viewer
    id="viewer"
    src="urn:vertex:stream-key:123"
  >
  </vertex-viewer>
</template>
```

## Documentation

See [@vertexvis/viewer][component docs] for a full list of components and their
documentation.

[vue plugins]: https://vuejs.org/guide/reusability/plugins.html
[component docs]: https://github.com/Vertexvis/vertex-web-sdk/tree/master/packages/viewer/src/components
[css variables]: https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties
[global styles]: https://github.com/Vertexvis/vertex-web-sdk/blob/master/packages/viewer/src/css/global.css
