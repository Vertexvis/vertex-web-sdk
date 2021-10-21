# vertex-viewer-measurement-popover



<!-- Auto Generated Below -->


## Properties

| Property            | Attribute           | Description                                                                                                                                                                        | Type                                                                          | Default                  |
| ------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------ |
| `angleFormatter`    | --                  | An optional formatter that can be used to format the display of an angle. The formatting function is passed a calculated angle in degrees and is expected to return a string.      | `((angle: number) => string) \| undefined`                                    | `undefined`              |
| `angleUnits`        | `angle-units`       | The unit of angle-based measurement.                                                                                                                                               | `"degrees" \| "radians"`                                                      | `'degrees'`              |
| `distanceFormatter` | --                  | An optional formatter that can be used to format the display of a distance. The formatting function is passed a calculated real-world distance and is expected to return a string. | `((distance: number) => string) \| undefined`                                 | `undefined`              |
| `distanceUnits`     | `distance-units`    | The unit of distance-based measurement.                                                                                                                                            | `"centimeters" \| "feet" \| "inches" \| "meters" \| "millimeters" \| "yards"` | `'millimeters'`          |
| `fractionalDigits`  | `fractional-digits` | The number of fraction digits to display.                                                                                                                                          | `number`                                                                      | `2`                      |
| `measurementModel`  | --                  | The `MeasurementModel` that this popover should reflect. If not specified, a new `MeasurementModel` will be created, which can then be used to update the display of this popover. | `MeasurementModel`                                                            | `new MeasurementModel()` |
| `results`           | --                  |                                                                                                                                                                                    | `MeasurementResult[]`                                                         | `[]`                     |
| `summary`           | --                  |                                                                                                                                                                                    | `MeasurementDetailsSummary \| undefined`                                      | `undefined`              |


## CSS Custom Properties

| Name                                            | Description                                                                                                   |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `--viewer-measurement-details-background-color` | The background color to display behind the measurement details. Defaults to var(--white).                     |
| `--viewer-measurement-details-font-size`        | The font size to display the measurement details at. Defaults to 0.75rem.                                     |
| `--viewer-measurement-details-opacity`          | The opacity of the measurement details. Defaults to 0.95.                                                     |
| `--viewer-measurement-details-padding`          | The padding to display around the measurement details as well as between individual rows. Defaults to 0.5rem. |
| `--viewer-measurement-details-shadow`           | The box shadow of the measurement details. Defaults to 0 0 5px rgba(0, 0, 0, 0.25).                           |
| `--viewer-measurement-details-x-color`          | The color of the `X` label in measurements. Defaults to red.                                                  |
| `--viewer-measurement-details-y-color`          | The color of the `X` label in measurements. Defaults to var(--green-500).                                     |
| `--viewer-measurement-details-z-color`          | The color of the `X` label in measurements. Defaults to blue.                                                 |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
