# vertex-viewer-threejs-renderer



<!-- Auto Generated Below -->


## Properties

| Property          | Attribute          | Description | Type                                        | Default                   |
| ----------------- | ------------------ | ----------- | ------------------------------------------- | ------------------------- |
| `camera`          | `camera`           |             | `any`                                       | `new PerspectiveCamera()` |
| `clippingExtents` | `clipping-extents` |             | `number`                                    | `1000`                    |
| `drawMode`        | `draw-mode`        |             | `"animation-frame" \| "manual" \| "synced"` | `'synced'`                |
| `occlude`         | `occlude`          |             | `boolean`                                   | `false`                   |
| `scene`           | `scene`            |             | `any`                                       | `new Scene()`             |
| `viewer`          | --                 |             | `HTMLVertexViewerElement \| undefined`      | `undefined`               |
| `willDraw`        | --                 |             | `(() => void) \| undefined`                 | `undefined`               |


## Methods

### `draw() => Promise<void>`



#### Returns

Type: `Promise<void>`



### `hit(point: Point.Point) => Promise<Intersection[]>`



#### Returns

Type: `Promise<any[]>`




----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
