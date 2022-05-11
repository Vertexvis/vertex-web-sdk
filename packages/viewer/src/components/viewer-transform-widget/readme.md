# vertex-viewer-transform-widget



<!-- Auto Generated Below -->


## Properties

| Property        | Attribute        | Description                                                                                                                                                  | Type                                   | Default     |
| --------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------- | ----------- |
| `controller`    | --               | The controller that is responsible for performing transforms.                                                                                                | `TransformController \| undefined`     | `undefined` |
| `disabledColor` | `disabled-color` | The color to display when persistence of a transform is pending. Defaults to `#cccccc`.                                                                      | `Color \| string`                      | `'#cccccc'` |
| `hoveredColor`  | `hovered-color`  | The color override of the hovered component. Defaults to `#ffff00`.                                                                                          | `Color \| string`                      | `'#ffff00'` |
| `position`      | --               | The starting position of this transform widget. This position will be updated as transforms occur. Setting this value to `undefined` will remove the widget. | `Vector3 \| undefined`                 | `undefined` |
| `viewer`        | --               | The viewer to connect to measurements. If nested within a <vertex-viewer>, this property will be populated automatically.                                    | `HTMLVertexViewerElement \| undefined` | `undefined` |
| `xArrowColor`   | `x-arrow-color`  | The color of the translation arrow on the x-axis. Defaults to `#ea3324`.                                                                                     | `Color \| string`                      | `'#ea3324'` |
| `yArrowColor`   | `y-arrow-color`  | The color of the translation arrow on the y-axis. Defaults to `#4faf32`.                                                                                     | `Color \| string`                      | `'#4faf32'` |
| `zArrowColor`   | `z-arrow-color`  | The color of the translation arrow on the z-axis. Defaults to `#0000ff`.                                                                                     | `Color \| string`                      | `'#0000ff'` |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
