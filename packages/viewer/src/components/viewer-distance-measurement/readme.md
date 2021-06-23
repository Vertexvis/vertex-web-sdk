# vertex-viewer-distance-measurement



<!-- Auto Generated Below -->


## Properties

| Property               | Attribute           | Description                                                                                                                                                                        | Type                                                                                                                                            | Default            |
| ---------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| `end`                  | `end`               | The position of the ending anchor. Can either be an instance of a `Vector3` or a JSON string representation in the format of `[x, y, z]` or `{"x": 0, "y": 0, "z": 0}`.            | `Vector3 \| string`                                                                                                                             | `Vector3.origin()` |
| `fractionalDigits`     | `fractional-digits` | The number of fraction digits to display.                                                                                                                                          | `number`                                                                                                                                        | `2`                |
| `labelFormatter`       | --                  | An optional formatter that can be used to format the display of a distance. The formatting function is passed a calculated real-world distance and is expected to return a string. | `((distance: number) => string) \| undefined`                                                                                                   | `undefined`        |
| `projectionViewMatrix` | --                  | The projection view matrix used to position the anchors. If `viewer` is defined, then the projection view matrix of the viewer will be used.                                       | `[number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number] \| undefined` | `undefined`        |
| `start`                | `start`             | The position of the starting anchor. Can either be an instance of a `Vector3` or a JSON string representation in the format of `[x, y, z]` or `{"x": 0, "y": 0, "z": 0}`.          | `Vector3 \| string`                                                                                                                             | `Vector3.origin()` |
| `units`                | `units`             | The unit of measurement.                                                                                                                                                           | `"centimeters" \| "feet" \| "inches" \| "meters" \| "millimeters" \| "yards"`                                                                   | `'millimeters'`    |
| `viewer`               | --                  | The viewer to connect to this measurement. The measurement will redraw any time the viewer redraws the scene.                                                                      | `HTMLVertexViewerElement \| undefined`                                                                                                          | `undefined`        |


## Methods

### `computeElementMetrics() => Promise<ViewerDistanceMeasurementElementMetrics>`

Computes the bounding boxes of the anchors and label. **Note:** invoking
this function uses `getBoundingClientRect` internally and will cause a
relayout of the DOM.

#### Returns

Type: `Promise<ViewerDistanceMeasurementElementMetrics>`




## CSS Custom Properties

| Name                                              | Description                                                                                |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `--viewer-distance-measurement-label-background`  | A CSS background that specifies the background color or image for the measurement's label. |
| `--viewer-distance-measurement-label-border`      | A CSS border that specifies the border color or image for the measurement's label.         |
| `--viewer-distance-measurement-label-padding`     | A CSS length that specifies the padding of the measurement's label.                        |
| `--viewer-distance-measurement-line-stroke`       | A CSS color that specifies the color of the measurement line.                              |
| `--viewer-distance-measurement-line-stroke-width` | A CSS length that width of the measurement line.                                           |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
