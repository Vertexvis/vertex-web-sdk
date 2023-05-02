# vertex-viewer-hit-result-indicator



<!-- Auto Generated Below -->


## Properties

| Property   | Attribute | Description                                                                                                                                                  | Type                                   | Default     |
| ---------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------- | ----------- |
| `normal`   | --        |                                                                                                                                                              | `Vector3 \| undefined`                 | `undefined` |
| `position` | --        | The starting position of this transform widget. This position will be updated as transforms occur. Setting this value to `undefined` will remove the widget. | `Vector3 \| undefined`                 | `undefined` |
| `viewer`   | --        | The viewer to connect to transforms. If nested within a <vertex-viewer>, this property will be populated automatically.                                      | `HTMLVertexViewerElement \| undefined` | `undefined` |


## CSS Custom Properties

| Name                                               | Description                                                                               |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `--viewer-hit-result-indicator-x-axis-arrow-color` | A CSS color for the arrow at the end of the X axis on this widget. Defaults to `#ea3324`. |
| `--viewer-hit-result-indicator-y-axis-arrow-color` | A CSS color for the arrow at the end of the Y axis on this widget. Defaults to `#4faf32`. |
| `--viewer-hit-result-indicator-z-axis-arrow-color` | A CSS color for the arrow at the end of the Z axis on this widget. Defaults to `#0000ff`. |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
