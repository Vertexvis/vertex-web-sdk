# vertex-viewer-pin-label



<!-- Auto Generated Below -->


## Properties

| Property        | Attribute | Description                                                                    | Type                         | Default     |
| --------------- | --------- | ------------------------------------------------------------------------------ | ---------------------------- | ----------- |
| `elementBounds` | --        | The dimensions of the canvas for the pins                                      | `DOMRect \| undefined`       | `undefined` |
| `pin`           | --        | The pin to draw for the group                                                  | `TextPin \| undefined`       | `undefined` |
| `pinController` | --        | The controller that drives behavior for pin operations                         | `PinController \| undefined` | `undefined` |
| `value`         | `value`   | The current text value of the component. Value is updated on user interaction. | `string`                     | `undefined` |


## Events

| Event          | Description                                                                                                    | Type                               |
| -------------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `labelBlurred` | Emitted whenever the label is blurred, with the ID of the associated pin (or undefined if no pin is provided). | `CustomEvent<string \| undefined>` |
| `labelFocused` | Emitted whenever the label is focused, with the ID of the associated pin (or undefined if no pin is provided). | `CustomEvent<string \| undefined>` |


## Methods

### `setFocus() => Promise<void>`

Gives focus to the the component's internal text input.

#### Returns

Type: `Promise<void>`




## Dependencies

### Used by

 - [vertex-viewer-pin-group](../viewer-pin-group)

### Graph
```mermaid
graph TD;
  vertex-viewer-pin-group --> vertex-viewer-pin-label
  style vertex-viewer-pin-label fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
