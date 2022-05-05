# vertex-viewer-markup-arrow



<!-- Auto Generated Below -->


## Properties

| Property    | Attribute | Description                                                                                                                                                                                                                                                                                                               | Type                                   | Default     |
| ----------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- | ----------- |
| `end`       | --        | The position of the ending anchor. Can either be an instance of a `Point` or a JSON string representation in the format of `[x, y]` or `{"x": 0, "y": 0}`.  Points are expected to be relative coordinates from `[-0.5, 0.5]`, e.g. `[0, 0]` corresponds to a point in the center of the viewport.                        | `Point \| undefined`                   | `undefined` |
| `endJson`   | `end`     | The position of the ending anchor, as a JSON string. Can either be an instance of a `Point` or a JSON string representation in the format of `[x, y]` or `{"x": 0, "y": 0}`.  Points are expected to be relative coordinates from `[-0.5, 0.5]`, e.g. `[0, 0]` corresponds to a point in the center of the viewport.      | `string \| undefined`                  | `undefined` |
| `mode`      | `mode`    | A mode that specifies how the markup component should behave. When unset, the component will not respond to interactions with the handles. When `edit`, the markup anchors are interactive and the user is able to reposition them. When `create`, anytime the user clicks on the canvas, a new markup will be performed. | `"" \| "create" \| "edit"`             | `''`        |
| `start`     | --        | The position of the starting anchor. Can either be an instance of a `Point` or a JSON string representation in the format of `[x, y]` or `{"x": 0, "y": 0}`.  Points are expected to be relative coordinates from `[-0.5, 0.5]`, e.g. `[0, 0]` corresponds to a point in the center of the viewport.                      | `Point \| undefined`                   | `undefined` |
| `startJson` | `start`   | The position of the starting anchor, as a JSON string. Can either be an instance of a `Point` or a JSON string representation in the format of `[x, y]` or `{"x": 0, "y": 0}`.  Points are expected to be relative coordinates from `[-0.5, 0.5]`, e.g. `[0, 0]` corresponds to a point in the center of the viewport.    | `string \| undefined`                  | `undefined` |
| `viewer`    | --        | The viewer to connect to markups.  This property will automatically be set when a child of a `<vertex-viewer-markup>` or `<vertex-viewer>` element.                                                                                                                                                                       | `HTMLVertexViewerElement \| undefined` | `undefined` |


## Events

| Event          | Description                                                                                                             | Type                |
| -------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------- |
| `editBegin`    | An event that is dispatched anytime the user begins editing the markup.                                                 | `CustomEvent<void>` |
| `editEnd`      | An event that is dispatched when the user has finished editing the markup.                                              | `CustomEvent<void>` |
| `viewRendered` | An event that is dispatched when this markup element is in view mode (`this.mode === ""`), and it completes a rerender. | `CustomEvent<void>` |


## Methods

### `dispose() => Promise<void>`



#### Returns

Type: `Promise<void>`




## Dependencies

### Used by

 - [vertex-viewer-markup](../viewer-markup)
 - [vertex-viewer-markup-tool](../viewer-markup-tool)

### Graph
```mermaid
graph TD;
  vertex-viewer-markup --> vertex-viewer-markup-arrow
  vertex-viewer-markup-tool --> vertex-viewer-markup-arrow
  style vertex-viewer-markup-arrow fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
