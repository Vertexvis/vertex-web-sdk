# vertex-viewer-dom-element

The `<vertex-viewer-dom-element>` is an element that specifies the 3D position,
rotation, and scale of a DOM element. They're expected to be added as children
to a `<vertex-viewer-dom-renderer>`.

See [`<vertex-viewer-dom-renderer>`](./viewer-dom-renderer/readme.md) for more
information.

<!-- Auto Generated Below -->


## Properties

| Property       | Attribute       | Description                                                                                                                                                                                                                                                         | Type                            | Default                   |
| -------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- | ------------------------- |
| `billboardOff` | `billboard-off` | Disables the billboarding behavior of the element. When billboarding is enabled, the element will always be oriented towards the screen.                                                                                                                            | `boolean`                       | `false`                   |
| `position`     | `position`      | The 3D position where this element is located. Can either be an instance of a `Vector3` or a JSON string representation in the format of `[x, y, z]` or `{"x": 0, "y": 0, "z": 0}`.                                                                                 | `Vector3 \| string`             | `Vector3.origin()`        |
| `rotation`     | `rotation`      | The rotation of this this element, represented as a `Quaternion`, `Euler` or a JSON string representation in one of the following formats:  * `[x, y, z, w]` * `{"x": 0, "y": 0, "z": 0, "w": 0}` * `[x, y, z, order]` * `{"x": 0, "y": 0, "z": 0, "order": "xyz"}` | `Euler \| Quaternion \| string` | `Quaternion.create()`     |
| `scale`        | `scale`         | The scale of this element. Can either be an instance of a `Vector3` or a JSON string representation in the format of `[x, y, z]` or `{"x": 0, "y": 0, "z": 0}`.                                                                                                     | `Vector3 \| string`             | `Vector3.create(1, 1, 1)` |


## Events

| Event            | Description                                                        | Type                |
| ---------------- | ------------------------------------------------------------------ | ------------------- |
| `propertyChange` | An event that's emitted when a property of this component changes. | `CustomEvent<void>` |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
