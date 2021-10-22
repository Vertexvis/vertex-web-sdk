# vertex-viewer-measurement-details

The `<vertex-viewer-measurement-details>` component displays the results
of a measurement that has been performed. A `MeasurementModel` can be provided,
and this component will listen for any changes to the model and update to display
new results. Alternatively, if no `MeasurementModel` is passed, one will be
created, and can then be used to control the display of this component.

## Units of Distance-Based Measurement and Formatting

The displayed units of distance-based measurement and precision can be configured by setting
the `distance-units` and `fractional-digits` attributes. Currently supported units
include: `millimeters`, `centimeters`, `meters`, `inches`, `feet`, `yards`.

**Example:** Settings units and fractional digits.

```html
<html>
<body>
  <vertex-viewer id="viewer" src="urn:vertexvis:stream-key:my-key">
    <vertex-viewer-measurements>
      <vertex-viewer-measurement-details
        distance-units="inches"
        fractional-digits="1"
      ></vertex-viewer-measurement-details>
    </vertex-viewer-measurements>
  </vertex-viewer>
</body>
</html>
```

Default formatting for distance-based measurements can be overridden by setting 
the `distanceFormatter` property. This is a function that is passed the distance 
in real space and should return a string.

**Example:** Replacing the default distance formatter.

```html
<html>
<body>
  <vertex-viewer id="viewer" src="urn:vertexvis:stream-key:my-key">
    <vertex-viewer-measurements>
      <vertex-viewer-measurement-details
        id="measurement-details"
      ></vertex-viewer-measurement-details>
    </vertex-viewer-measurements>
  </vertex-viewer>

  <script type="module">
    const details = document.getElementById('measurement-details');
    details.distanceFormatter = (distance) => `${distance}"`;
  </script>
</body>
</html>
```

## Units of Angle-Based Measurement and Formatting

The displayed units of angle-based measurement and precision can be configured by setting
the `angle-units` and `fractional-digits` attributes. Currently supported units
include: `degrees` and `radians`.

**Example:** Settings units and fractional digits.

```html
<html>
<body>
  <vertex-viewer id="viewer" src="urn:vertexvis:stream-key:my-key">
    <vertex-viewer-measurements>
      <vertex-viewer-measurement-details
        angle-units="radians"
        fractional-digits="1"
      ></vertex-viewer-measurement-details>
    </vertex-viewer-measurements>
  </vertex-viewer>
</body>
</html>
```

Default formatting for angle-based measurements can be overridden by setting 
the `angleFormatter` property. This is a function that is passed the angle
in degrees, and should return a string.

**Example:** Replacing the default angle formatter.

```html
<html>
<body>
  <vertex-viewer id="viewer" src="urn:vertexvis:stream-key:my-key">
    <vertex-viewer-measurements>
      <vertex-viewer-measurement-details
        id="measurement-details"
      ></vertex-viewer-measurement-details>
    </vertex-viewer-measurements>
  </vertex-viewer>

  <script type="module">
    const details = document.getElementById('measurement-details');
    details.angleFormatter = (angle) => `${angle}"`;
  </script>
</body>
</html>
```

<!-- Auto Generated Below -->


## Properties

| Property            | Attribute           | Description                                                                                                                                                                                                                                                                         | Type                                                                          | Default                  |
| ------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------ |
| `angleFormatter`    | --                  | An optional formatter that can be used to format the display of an angle. The formatting function is passed a calculated angle in degrees and is expected to return a string.                                                                                                       | `((angle: number) => string) \| undefined`                                    | `undefined`              |
| `angleUnits`        | `angle-units`       | The unit of angle-based measurement.                                                                                                                                                                                                                                                | `"degrees" \| "radians"`                                                      | `'degrees'`              |
| `distanceFormatter` | --                  | An optional formatter that can be used to format the display of a distance. The formatting function is passed a calculated real-world distance and is expected to return a string.                                                                                                  | `((distance: number) => string) \| undefined`                                 | `undefined`              |
| `distanceUnits`     | `distance-units`    | The unit of distance-based measurement.                                                                                                                                                                                                                                             | `"centimeters" \| "feet" \| "inches" \| "meters" \| "millimeters" \| "yards"` | `'millimeters'`          |
| `fractionalDigits`  | `fractional-digits` | The number of fraction digits to display.                                                                                                                                                                                                                                           | `number`                                                                      | `2`                      |
| `hiddenDetails`     | --                  | An optional set of details to hide. This can be used to display reduced sets of details for more a more focused representation. Can be provided as an array of keys from the `ViewerMeasurementDetailsSummary` type, or as a JSON array with the format '["angle", "minDistance"]'. | `(keyof ViewerMeasurementDetailsSummary)[] \| undefined`                      | `undefined`              |
| `hiddenDetailsJson` | `hidden-details`    | An optional set of details to hide. This can be used to display reduced sets of details for more a more focused representation. Can be provided as an array of keys from the `ViewerMeasurementDetailsSummary` type, or as a JSON array with the format '["angle", "minDistance"]'. | `string \| undefined`                                                         | `undefined`              |
| `measurementModel`  | --                  | The `MeasurementModel` that should be reflected in these details. If not specified, a new `MeasurementModel` will be created, which can then be used to update the display.                                                                                                         | `MeasurementModel`                                                            | `new MeasurementModel()` |
| `results`           | --                  |                                                                                                                                                                                                                                                                                     | `MeasurementResult[]`                                                         | `[]`                     |
| `summary`           | --                  |                                                                                                                                                                                                                                                                                     | `ViewerMeasurementDetailsSummary \| undefined`                                | `undefined`              |


## CSS Custom Properties

| Name                                   | Description                                                               |
| -------------------------------------- | ------------------------------------------------------------------------- |
| `--viewer-measurement-details-x-color` | The color of the `X` label in measurements. Defaults to red.              |
| `--viewer-measurement-details-y-color` | The color of the `X` label in measurements. Defaults to var(--green-500). |
| `--viewer-measurement-details-z-color` | The color of the `X` label in measurements. Defaults to blue.             |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
