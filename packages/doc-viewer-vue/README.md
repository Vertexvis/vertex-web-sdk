# Vue Bindings for Vertex Document Viewer SDK

![npm](https://img.shields.io/npm/v/@vertexvis/doc-viewer-vue)
![npm (scoped with tag)](https://img.shields.io/npm/v/@vertexvis/doc-viewer-vue/canary)

This project contains Vue bindings for Vertex's Document Viewer SDK. These bindings are
auto-generated from `@vertexvis/doc-viewer`.

## Installation

Run `yarn add @vertexvis/doc-viewer-vue` or `npm install @vertexvis/doc-viewer-vue`
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

Next, `@vertexvis/doc-viewer-vue` includes a Vue [Plugin][vue plugins], 
`VertexDocumentViewerPlugin`, that needs to be added to the Vue App. It also
includes a global stylesheet with default styling. Consult your bundler's
documentation on how to bundle CSS with your project's bundler.

```jsx
import '@vertexvis/doc-viewer/dist/doc-viewer/doc-viewer.css';

import { createApp } from 'vue';
import { VertexDocumentViewerPlugin } from '@vertexvis/doc-viewer-vue';
import App from './App.vue';

createApp(App).use(VertexDocumentViewerPlugin).mount('#app');
```

Lastly, use the component wrappers in one of your Vue components.

```tsx
<script setup lang="ts">
  import { onMounted, ref } from 'vue';
  import workerSrc from '@vertexvis/doc-viewer/assets/pdf.worker.min.mjs?url';
  
  const viewer = ref<HTMLVertexDocumentViewerElement | null>(null);

  onMounted(async () => {
    if (viewer.value != null) {
      // Configure the PDF.js worker source relative to your application's build
      viewer.value.config = {
        pdfJs: {
          workerSrc
        }
      }
    }
  });
</script>

<template>
  <vertex-document-viewer
    id="document-viewer"
    ref="viewer"
    src="https://{{ DOCUMENT_URL }}"
  >
  </vertex-document-viewer>
</template>
```

## Documentation

See [@vertexvis/doc-viewer][component docs] for a full list of components and their
documentation.

[vue plugins]: https://vuejs.org/guide/reusability/plugins.html
[component docs]: https://github.com/Vertexvis/vertex-web-sdk/tree/master/packages/doc-viewer/src/components
[css variables]: https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties
[global styles]: https://github.com/Vertexvis/vertex-web-sdk/blob/master/packages/doc-viewer/src/css/global.css
