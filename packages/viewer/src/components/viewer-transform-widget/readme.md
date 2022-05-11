# vertex-viewer-transform-widget



<!-- Auto Generated Below -->


## Properties

| Property       | Attribute       | Description                                                                                                                                                  | Type                                   | Default     |
| -------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------- | ----------- |
| `controller`   | --              | The controller that is responsible for performing transforms.                                                                                                | `TransformController \| undefined`     | `undefined` |
| `hoveredColor` | `hovered-color` | The color override of the hovered component. Defaults to `#ffff00`.                                                                                          | `Color \| string \| undefined`         | `undefined` |
| `position`     | --              | The starting position of this transform widget. This position will be updated as transforms occur. Setting this value to `undefined` will remove the widget. | `Vector3 \| undefined`                 | `undefined` |
| `viewer`       | --              | The viewer to connect to measurements. If nested within a <vertex-viewer>, this property will be populated automatically.                                    | `HTMLVertexViewerElement \| undefined` | `undefined` |
| `xArrowColor`  | `x-arrow-color` | The color of the translation arrow on the x-axis. Defaults to `#ff0000`.                                                                                     | `Color \| string \| undefined`         | `undefined` |
| `yArrowColor`  | `y-arrow-color` | The color of the translation arrow on the y-axis. Defaults to `#00ff00`.                                                                                     | `Color \| string \| undefined`         | `undefined` |
| `zArrowColor`  | `z-arrow-color` | The color of the translation arrow on the z-axis. Defaults to `#0000ff`.                                                                                     | `Color \| string \| undefined`         | `undefined` |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
