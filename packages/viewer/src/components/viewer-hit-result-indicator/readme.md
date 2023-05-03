# vertex-viewer-hit-result-indicator



<!-- Auto Generated Below -->


## Properties

| Property   | Attribute | Description                                                                                                                                                                                   | Type                                   | Default     |
| ---------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- | ----------- |
| `normal`   | --        | The normal of this indicator. This value will be represented as an arrow, and will be used alongside the provided `position` to display a plane.                                              | `Vector3 \| undefined`                 | `undefined` |
| `position` | --        | The position of this indicator. A point will be displayed at this position, and it will be used alongside the provided `normal` to display a plane and normal arrow centered at the position. | `Vector3 \| undefined`                 | `undefined` |
| `viewer`   | --        | The viewer to connect to this indicator. If nested within a <vertex-viewer>, this property will be populated automatically.                                                                   | `HTMLVertexViewerElement \| undefined` | `undefined` |


## CSS Custom Properties

| Name                                          | Description                                                                                      |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `--viewer-hit-result-indicator-arrow-color`   | A CSS color for the arrow representing the normal for this hit indicator. Defaults to `#0099cc`. |
| `--viewer-hit-result-indicator-outline-color` | A CSS color for the outline of the plane and arrow. Defaults to `#000000`.                       |
| `--viewer-hit-result-indicator-plane-color`   | A CSS color for the plane for this hit indicator. Defaults to `#0099cc`.                         |
| `--viewer-hit-result-indicator-plane-opacity` | A CSS number for the opacity of the plane for this hit indicator. Defaults to `0.75`.            |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
