# vertex-viewer-transform-widget



<!-- Auto Generated Below -->


## Properties

| Property     | Attribute | Description                                                                                                                                                  | Type                                   | Default     |
| ------------ | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------- | ----------- |
| `controller` | --        | The controller that is responsible for performing transforms.                                                                                                | `TransformController \| undefined`     | `undefined` |
| `position`   | --        | The starting position of this transform widget. This position will be updated as transforms occur. Setting this value to `undefined` will remove the widget. | `Vector3 \| undefined`                 | `undefined` |
| `viewer`     | --        | The viewer to connect to transforms. If nested within a <vertex-viewer>, this property will be populated automatically.                                      | `HTMLVertexViewerElement \| undefined` | `undefined` |


## Events

| Event                | Description                                                       | Type                                                                                                                                                         |
| -------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `deltaChanged`       | An event that is emitted when the delta changed                   | `CustomEvent<[number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number] \| undefined>` |
| `interactionStarted` | An event that is emitted when the delta changed                   | `CustomEvent<void>`                                                                                                                                          |
| `positionChanged`    | An event that is emitted when the position of the widget changes. | `CustomEvent<Vector3 \| undefined>`                                                                                                                          |


## CSS Custom Properties

| Name                                             | Description                                                                               |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| `--viewer-transform-widget-disabled-arrow-color` | A CSS color for the arrow when it is disabled. Defaults to `#cccccc`.                     |
| `--viewer-transform-widget-hovered-arrow-color`  | A CSS color for the arrow when it is hovered. Defaults to `#ffff00`.                      |
| `--viewer-transform-widget-x-axis-arrow-color`   | A CSS color for the arrow at the end of the X axis on this widget. Defaults to `#ea3324`. |
| `--viewer-transform-widget-y-axis-arrow-color`   | A CSS color for the arrow at the end of the Y axis on this widget. Defaults to `#4faf32`. |
| `--viewer-transform-widget-z-axis-arrow-color`   | A CSS color for the arrow at the end of the Z axis on this widget. Defaults to `#0000ff`. |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
