# vertex-viewer-dom-element

The `<vertex-viewer-dom-element>` is an element that specifies the 3D position,
rotation, and scale of a DOM element. They're expected to be added as children
to a `<vertex-viewer-dom-renderer>`.

See [`<vertex-viewer-dom-renderer>`](./viewer-dom-renderer/readme.md) for more
information.

<!-- Auto Generated Below -->


## Properties

| Property       | Attribute       | Description                                                                                                                              | Type                            | Default                   |
| -------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- | ------------------------- |
| `billboardOff` | `billboard-off` | Disables the billboarding behavior of the element. When billboarding is enabled, the element will always be oriented towards the screen. | `boolean`                       | `false`                   |
| `position`     | `position`      | The 3D position where this element is located.                                                                                           | `Vector3 \| string`             | `Vector3.origin()`        |
| `rotation`     | `rotation`      | The rotation of this this element, represented as a Quaternion.                                                                          | `Euler \| Quaternion \| string` | `Quaternion.create()`     |
| `scale`        | `scale`         | The scale of this element.                                                                                                               | `Vector3 \| string`             | `Vector3.create(1, 1, 1)` |
| `up`           | `up`            | The direction which this object considers up.                                                                                            | `Vector3 \| string`             | `Vector3.up()`            |


## Events

| Event            | Description                                                        | Type                |
| ---------------- | ------------------------------------------------------------------ | ------------------- |
| `propertyChange` | An event that's emitted when a property of this component changes. | `CustomEvent<void>` |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
