# vertex-viewer-dom-group

The `<vertex-viewer-dom-group>` is an element that specifies the 3D position,
rotation, and scale for a group of
[`<vertex-viewer-dom-element>`s](../viewer-dom-element/readme.md) or other
`<vertex-viewer-dom-group>`s.

They're expected to be added as children to a `<vertex-viewer-dom-renderer>`.

See [`<vertex-viewer-dom-renderer>`](../viewer-dom-renderer/readme.md) for more
information.

<!-- Auto Generated Below -->


## Properties

| Property         | Attribute    | Description                                                                                                                                                               | Type                                                                                                                               | Default                   |
| ---------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| `matrix`         | --           | The local matrix of this element.                                                                                                                                         | `[number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number]` | `Matrix4.makeIdentity()`  |
| `position`       | --           | The local 3D position of where this element is located.                                                                                                                   | `Vector3`                                                                                                                          | `Vector3.origin()`        |
| `positionJson`   | `position`   | The local 3D position of where this element is located, as a JSON string. JSON representation can either be in the format of `[x, y, z]` or `{"x": 0, "y": 0, "z": 0}`.   | `string`                                                                                                                           | `''`                      |
| `quaternion`     | --           | The local rotation of this element.                                                                                                                                       | `Quaternion`                                                                                                                       | `Quaternion.create()`     |
| `quaternionJson` | `quaternion` | The local rotation of this element, as a JSON string. JSON representation can either be `[x, y, z, w]` or `{"x": 0, "y": 0, "z": 0, "w": 1}`.                             | `string`                                                                                                                           | `''`                      |
| `rotation`       | --           | The local rotation of this element in Euler angles.                                                                                                                       | `Euler \| undefined`                                                                                                               | `undefined`               |
| `rotationJson`   | `rotation`   | The local rotation of this element in Euler angles, as a JSON string. JSON representation can either be `[x, y, z, order]` or `{"x": 0, "y": 0, "z": 0, "order": "xyz"}`. | `string \| undefined`                                                                                                              | `undefined`               |
| `scale`          | --           | The local scale of this element.                                                                                                                                          | `Vector3`                                                                                                                          | `Vector3.create(1, 1, 1)` |
| `scaleJson`      | `scale`      | The local scale of this element, as a JSON string. JSON string representation can either be in the format of `[x, y, z]` or `{"x": 0, "y": 0, "z": 0}`.                   | `string`                                                                                                                           | `''`                      |


## Events

| Event            | Description                                                        | Type                |
| ---------------- | ------------------------------------------------------------------ | ------------------- |
| `propertyChange` | An event that's emitted when a property of this component changes. | `CustomEvent<void>` |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
