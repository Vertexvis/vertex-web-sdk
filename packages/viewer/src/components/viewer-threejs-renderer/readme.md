# vertex-viewer-threejs-renderer



<!-- Auto Generated Below -->


## Properties

| Property          | Attribute          | Description | Type                                        | Default                   |
| ----------------- | ------------------ | ----------- | ------------------------------------------- | ------------------------- |
| `camera`          | --                 |             | `PerspectiveCamera`                         | `new PerspectiveCamera()` |
| `clippingExtents` | `clipping-extents` |             | `number`                                    | `1000`                    |
| `drawMode`        | `draw-mode`        |             | `"animation-frame" \| "manual" \| "synced"` | `'synced'`                |
| `occlude`         | `occlude`          |             | `boolean`                                   | `false`                   |
| `scene`           | --                 |             | `Scene`                                     | `new Scene()`             |
| `viewer`          | --                 |             | `HTMLVertexViewerElement \| undefined`      | `undefined`               |
| `willDraw`        | --                 |             | `(() => void) \| undefined`                 | `undefined`               |


## Methods

### `draw() => Promise<void>`



#### Returns

Type: `Promise<void>`



### `hit(point: Point.Point) => Promise<Intersection[]>`



#### Returns

Type: `Promise<Intersection[]>`




----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
