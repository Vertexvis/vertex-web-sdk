# vertex-document-viewer



<!-- Auto Generated Below -->


## Properties

| Property         | Attribute         | Description                                                                                                     | Type                  | Default     |
| ---------------- | ----------------- | --------------------------------------------------------------------------------------------------------------- | --------------------- | ----------- |
| `resizeDebounce` | `resize-debounce` | An optional value that will debounce image updates when resizing this viewer element.                           | `number`              | `100`       |
| `src`            | `src`             | A URI of the document to load when the component is mounted in the DOM tree. Currently only URLs are supported. | `string \| undefined` | `undefined` |


## Methods

### `panByDelta(delta: Point.Point) => Promise<void>`



#### Parameters

| Name    | Type    | Description |
| ------- | ------- | ----------- |
| `delta` | `Point` |             |

#### Returns

Type: `Promise<void>`



### `zoomTo(percentage: number) => Promise<void>`



#### Parameters

| Name         | Type     | Description |
| ------------ | -------- | ----------- |
| `percentage` | `number` |             |

#### Returns

Type: `Promise<void>`




----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
