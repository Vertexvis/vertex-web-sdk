# vertex-viewer-measurement-tool

The `<vertex-viewer-measurement-tool>` component is used to manage the user
interactions for performing new measurements.

This component is normally added to a
[`<vertex-viewer-measurements>`](../viewer-measurements/readme.md), which will
manage the properties of this component. However, the component can be used
independently for more advanced or custom use-cases.

<!-- Auto Generated Below -->


## Properties

| Property             | Attribute              | Description                                                                                                                                                                                                                                                                       | Type                                                                          | Default                     |
| -------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | --------------------------- |
| `disabled`           | `disabled`             | Disables measurements.  This property will automatically be set when a child of a `<vertex-viewer-measurements>` element.                                                                                                                                                         | `boolean`                                                                     | `false`                     |
| `distanceTemplateId` | `distance-template-id` | An ID to an HTML template that describes the HTML content to use for distance measurements. It's expected that the template contains a `<vertex-viewer-measurement-distance>`.  This property will automatically be set when a child of a `<vertex-viewer-measurements>` element. | `string \| undefined`                                                         | `undefined`                 |
| `fractionalDigits`   | `fractional-digits`    | The number of fractional digits to display measurements in.                                                                                                                                                                                                                       | `number`                                                                      | `2`                         |
| `isMeasuring`        | `is-measuring`         | A property that indicates if the user is performing a measurement.                                                                                                                                                                                                                | `boolean`                                                                     | `false`                     |
| `snapDistance`       | `snap-distance`        | The distance, in pixels, between the mouse and nearest snappable edge. A value of 0 disables snapping.                                                                                                                                                                            | `number`                                                                      | `MEASUREMENT_SNAP_DISTANCE` |
| `tool`               | `tool`                 | The type of measurement.  This property will automatically be set when a child of a `<vertex-viewer-measurements>` element.                                                                                                                                                       | `"distance"`                                                                  | `'distance'`                |
| `units`              | `units`                | The unit type to display measurements in.                                                                                                                                                                                                                                         | `"centimeters" \| "feet" \| "inches" \| "meters" \| "millimeters" \| "yards"` | `'millimeters'`             |
| `viewer`             | --                     | The viewer to connect to measurements.  This property will automatically be set when a child of a `<vertex-viewer-measurements>` or `<vertex-viewer>` element.                                                                                                                    | `HTMLVertexViewerElement \| undefined`                                        | `undefined`                 |


## Events

| Event          | Description                                                             | Type                               |
| -------------- | ----------------------------------------------------------------------- | ---------------------------------- |
| `measureBegin` | An event that is dispatched when a user begins a new measurement.       | `CustomEvent<void>`                |
| `measureEnd`   | An event that is dispatched when a user has finished their measurement. | `CustomEvent<DistanceMeasurement>` |


## Dependencies

### Depends on

- [vertex-viewer-layer](../viewer-layer)
- [vertex-viewer-measurement-distance](../viewer-measurement-distance)

### Graph
```mermaid
graph TD;
  vertex-viewer-measurement-tool --> vertex-viewer-layer
  vertex-viewer-measurement-tool --> vertex-viewer-measurement-distance
  vertex-viewer-measurement-distance --> vertex-viewer-measurement-line
  style vertex-viewer-measurement-tool fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
