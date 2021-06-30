# vertex-viewer-measurement-tool



<!-- Auto Generated Below -->


## Properties

| Property   | Attribute   | Description | Type                                   | Default      |
| ---------- | ----------- | ----------- | -------------------------------------- | ------------ |
| `cssClass` | `css-class` |             | `string`                               | `''`         |
| `tool`     | `tool`      |             | `"distance"`                           | `'distance'` |
| `viewer`   | --          |             | `HTMLVertexViewerElement \| undefined` | `undefined`  |


## Events

| Event      | Description | Type                               |
| ---------- | ----------- | ---------------------------------- |
| `measured` |             | `CustomEvent<DistanceMeasurement>` |


## Dependencies

### Depends on

- [vertex-viewer-distance-measurement](../viewer-distance-measurement)

### Graph
```mermaid
graph TD;
  vertex-viewer-measurement-tool --> vertex-viewer-distance-measurement
  vertex-viewer-distance-measurement --> vertex-viewer-measurement-line
  style vertex-viewer-measurement-tool fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
