# vertex-viewer-pin-group



<!-- Auto Generated Below -->


## Properties

| Property               | Attribute  | Description                                                                      | Type                                                                                                                               | Default                  |
| ---------------------- | ---------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| `elementBounds`        | --         | The dimensions of the canvas for the pins                                        | `DOMRect \| undefined`                                                                                                             | `undefined`              |
| `matrix`               | --         | The local matrix of this element.                                                | `[number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number]` | `Matrix4.makeIdentity()` |
| `pin`                  | --         | The pin to draw for the group                                                    | `IconPin \| TextPin \| undefined`                                                                                                  | `undefined`              |
| `pinController`        | --         | The controller that drives behavior for pin operations                           | `PinController \| undefined`                                                                                                       | `undefined`              |
| `pinModel`             | --         | The model that contains the entities and outcomes from performing pin operations | `PinModel`                                                                                                                         | `new PinModel()`         |
| `projectionViewMatrix` | --         | Projection view matrix used for computing the position of the pin line           | `[number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number]` | `Matrix4.makeIdentity()` |
| `selected`             | `selected` | Whether the pin is "selected"                                                    | `boolean`                                                                                                                          | `false`                  |


## CSS Custom Properties

| Name                                       | Description                                                                                                   |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `--viewer-annotations-pin-accent-color`    | A CSS color that specifies the accent color for the pins. This value gets used for background colors          |
| `--viewer-annotations-pin-color`           | A CSS color that specifies the color of the pin                                                               |
| `--viewer-annotations-pin-font-size`       | A CSS property to specify the font size of the pin                                                            |
| `--viewer-annotations-pin-label-border`    | A CSS color that specifies the border of a text pin anchor                                                    |
| `--viewer-annotations-pin-primary-color`   | A CSS color that specifies the primary color for the pins. This value gets used for the dot color and borders |
| `--viewer-annotations-pin-selected-border` | A CSS color that specifies the border of a selected pin                                                       |
| `--viewer-annotations-pin-selected-stroke` | A CSS color that specifies the stroke color of a selected pin                                                 |


## Dependencies

### Used by

 - [vertex-viewer-pin-tool](../viewer-pin-tool)

### Depends on

- [vertex-viewer-dom-element](../viewer-dom-element)
- [vertex-viewer-pin-label-line](../viewer-pin-label-line)
- [vertex-viewer-pin-label](../viewer-pin-label)
- [vertex-viewer-icon](../viewer-icon)

### Graph
```mermaid
graph TD;
  vertex-viewer-pin-group --> vertex-viewer-dom-element
  vertex-viewer-pin-group --> vertex-viewer-pin-label-line
  vertex-viewer-pin-group --> vertex-viewer-pin-label
  vertex-viewer-pin-group --> vertex-viewer-icon
  vertex-viewer-pin-tool --> vertex-viewer-pin-group
  style vertex-viewer-pin-group fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
