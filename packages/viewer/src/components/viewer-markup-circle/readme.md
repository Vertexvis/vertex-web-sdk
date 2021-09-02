# vertex-viewer-markup-circle



<!-- Auto Generated Below -->


## Properties

| Property     | Attribute | Description                                                                                                                                                                                                                                                                                                                               | Type                                   | Default     |
| ------------ | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- | ----------- |
| `bounds`     | --        | The bounds of the circle. Can either be an instance of a `Rectangle` or a JSON string representation in the format of `[x, y, width, height]` or `{"x": 0, "y": 0, "width": 10, "height": 10}`.                                                                                                                                           | `Rectangle \| undefined`               | `undefined` |
| `boundsJson` | `bounds`  | The bounds of the circle. Can either be an instance of a `Rectangle` or a JSON string representation in the format of `[x, y, width, height]` or `{"x": 0, "y": 0, "width": 10, "height": 10}`.                                                                                                                                           | `string \| undefined`                  | `undefined` |
| `mode`       | `mode`    | A mode that specifies how the measurement component should behave. When unset, the component will not respond to interactions with the handles. When `edit`, the measurement anchors are interactive and the user is able to reposition them. When `replace`, anytime the user clicks on the canvas, a new measurement will be performed. | `"" \| "edit" \| "replace"`            | `''`        |
| `viewer`     | --        | The viewer to connect to measurements.  This property will automatically be set when a child of a `<vertex-viewer-measurements>` or `<vertex-viewer>` element.                                                                                                                                                                            | `HTMLVertexViewerElement \| undefined` | `undefined` |


## Events

| Event       | Description | Type                |
| ----------- | ----------- | ------------------- |
| `editBegin` |             | `CustomEvent<void>` |
| `editEnd`   |             | `CustomEvent<void>` |


## Dependencies

### Used by

 - [vertex-viewer-markup](../viewer-markup)
 - [vertex-viewer-markup-tool](../viewer-markup-tool)

### Graph
```mermaid
graph TD;
  vertex-viewer-markup --> vertex-viewer-markup-circle
  vertex-viewer-markup-tool --> vertex-viewer-markup-circle
  style vertex-viewer-markup-circle fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
