# vertex-viewer-measurement-line



<!-- Auto Generated Below -->


## Properties

| Property        | Attribute        | Description                                                                                                                                  | Type     | Default          |
| --------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ---------------- |
| `capLength`     | `cap-length`     | A length of the line cap. The line cap is a line at each end of a line.                                                                      | `number` | `0`              |
| `end`           | --               | A point that specifies the ending point of the line.                                                                                         | `Point`  | `Point.create()` |
| `pointerEvents` | `pointer-events` | The type of [SVG pointer events](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/pointer-events) that the line should respond to. | `string` | `'none'`         |
| `start`         | --               | A point that specifies the starting point of the line.                                                                                       | `Point`  | `Point.create()` |


## Dependencies

### Used by

 - [vertex-viewer-measurement-distance](../viewer-measurement-distance)
 - [vertex-viewer-measurement-overlays](../viewer-measurement-overlays)

### Graph
```mermaid
graph TD;
  vertex-viewer-measurement-distance --> vertex-viewer-measurement-line
  vertex-viewer-measurement-overlays --> vertex-viewer-measurement-line
  style vertex-viewer-measurement-line fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
