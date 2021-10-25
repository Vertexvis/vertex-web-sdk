# vertex-viewer-measurement-precise



<!-- Auto Generated Below -->


## Properties

| Property                | Attribute    | Description | Type                                       | Default                  |
| ----------------------- | ------------ | ----------- | ------------------------------------------ | ------------------------ |
| `config`                | --           |             | `Config \| undefined`                      | `undefined`              |
| `configEnv`             | `config-env` |             | `"platdev" \| "platprod" \| "platstaging"` | `'platprod'`             |
| `measurementController` | --           |             | `MeasurementController \| undefined`       | `undefined`              |
| `measurementModel`      | --           |             | `MeasurementModel`                         | `new MeasurementModel()` |
| `viewer`                | --           |             | `HTMLVertexViewerElement \| undefined`     | `undefined`              |


## Dependencies

### Depends on

- [vertex-viewer-dom-renderer](../viewer-dom-renderer)
- [vertex-viewer-dom-element](../viewer-dom-element)

### Graph
```mermaid
graph TD;
  vertex-viewer-measurement-precise --> vertex-viewer-dom-renderer
  vertex-viewer-measurement-precise --> vertex-viewer-dom-element
  style vertex-viewer-measurement-precise fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
