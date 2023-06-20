<!-- DO NOT EDIT THE README.md DIRECTLY. THIS FILE IS AUTO-GENERATED. -->
<!-- INSTEAD EDIT README.template.md -->

# 2D and 3D Geometry Types for JS

![npm](https://img.shields.io/npm/v/@vertexvis/geometry)
![npm (scoped with tag)](https://img.shields.io/npm/v/@vertexvis/viewer/canary)

2D and 3D Geometry Types for JS.

## Getting Started

### Script Tag

The easiest way to use the helpers provided in this package is by including a `<script>`
tag in your HTML file that references our published JS bundles from a CDN. These helpers
can then be used in combination with our [Viewer SDK](https://www.npmjs.com/package/@vertexvis/viewer)
to interact with the rendered scene. See the instructions there on getting started to set up a
viewer.

```html
<html>
  <head>
  </head>
  <body>
    <script type="module">
      import { Vector3 } from 'https://unpkg.com/@vertexvis/geometry@0.17.3/dist/cdn/bundle.esm.js';

      async function main() {
        const viewer = document.querySelector('#viewer');
        const scene = await viewer.scene();
        const camera = scene.camera();

        await camera.update({
          position: Vector3.create(0, 0, 100),
          lookAt: Vector3.origin(),
          up: Vector3.up(),
        })
        .render();
      }
    </script>
  </body>
</html>
```
