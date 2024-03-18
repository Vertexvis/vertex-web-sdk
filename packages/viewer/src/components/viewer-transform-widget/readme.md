# vertex-viewer-transform-widget


### Example
This example includes a transform widget with the x,y, and z rotation axis disabled.

The position of the widget is set on the hit result from a viewer tap.

The widget expects a part selected, which also occurs on a valid hit result.

```html
<html>
<body>
  <vertex-viewer
    id="viewer"
    config-env="platprod"
    src="urn:vertex:stream-key:ocgUAlbpe5dWkOjkHjUWzv7Sm1qWJpTi9sa4"
  >
    <vertex-viewer-transform-widget
      id="transform-widget"
      y-rotation-disabled
      x-rotation-disabled
      z-rotation-disabled
    ></vertex-viewer-transform-widget>
  </vertex-viewer>

  <script type="module">
    window.addEventListener('load', () => main());

    async function main() {
        await window.customElements.whenDefined('vertex-viewer');

        const viewer = document.getElementById('viewer');
        const tree = document.getElementById('scene-tree');
        const widget = document.getElementById('transform-widget');

        viewer.addEventListener('tap', async (event) => {
          const { position } = event.detail;
          const scene = await viewer.scene();
          const raycaster = await scene.raycaster();

          const result = await raycaster.hitItems(position);

          if (result.hits && result.hits.length == 0) {
            await scene
              .items((op) => op.where((q) => q.all()).deselect())
              .execute();
          } else {
            const widget = document.getElementById('transform-widget');
            const hit = result.hits[0];

            widget.position = hit.hitPoint;
            await scene
              .items((op) => [
                op.where((q) => q.all()).deselect(),
                op
                  .where((q) => q.withItemId(hit.itemId.hex))
                  .select(),
              ])
              .execute();
          }
        });
    }
  </script>
</body>
</html>
```


<!-- Auto Generated Below -->


## Properties

| Property               | Attribute                | Description                                                                                                                                                  | Type                                                                          | Default         |
| ---------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- | --------------- |
| `angleUnit`            | `angle-unit`             | The unit to show for rotation inputs. Defaults to `degrees`.                                                                                                 | `"degrees" \| "radians"`                                                      | `'degrees'`     |
| `controller`           | --                       | The controller that is responsible for performing transforms.                                                                                                | `TransformController \| undefined`                                            | `undefined`     |
| `decimalPlaces`        | `decimal-places`         | The number of decimal places to show in the input. Defaults to `1`.                                                                                          | `number`                                                                      | `1`             |
| `distanceUnit`         | `distance-unit`          | The unit to show for translation inputs. Defaults to `millimeters`.                                                                                          | `"centimeters" \| "feet" \| "inches" \| "meters" \| "millimeters" \| "yards"` | `'millimeters'` |
| `position`             | --                       | The starting position of this transform widget. This position will be updated as transforms occur. Setting this value to `undefined` will remove the widget. | `Vector3 \| undefined`                                                        | `undefined`     |
| `rotation`             | --                       | The starting angle for the transform widget. This rotation will be updated as the rotations occur.                                                           | `Euler \| undefined`                                                          | `undefined`     |
| `showInputs`           | `show-inputs`            | Whether to show inputs beside the widget handles when they are interacted with. Defaults to `true`.                                                          | `boolean`                                                                     | `true`          |
| `viewer`               | --                       | The viewer to connect to transforms. If nested within a <vertex-viewer>, this property will be populated automatically.                                      | `HTMLVertexViewerElement \| undefined`                                        | `undefined`     |
| `xRotationDisabled`    | `x-rotation-disabled`    | Determines whether or not the x-rotation is disabled on the widget                                                                                           | `boolean`                                                                     | `false`         |
| `xTranslationDisabled` | `x-translation-disabled` | Determines whether or not the x-translation is disabled on the widget                                                                                        | `boolean`                                                                     | `false`         |
| `yRotationDisabled`    | `y-rotation-disabled`    | Determines whether or not the y-rotation is disabled on the widget                                                                                           | `boolean`                                                                     | `false`         |
| `yTranslationDisabled` | `y-translation-disabled` | Determines whether or not the y-translation is disabled on the widget                                                                                        | `boolean`                                                                     | `false`         |
| `zRotationDisabled`    | `z-rotation-disabled`    | Determines whether or not the z-rotation is disabled on the widget                                                                                           | `boolean`                                                                     | `false`         |
| `zTranslationDisabled` | `z-translation-disabled` | Determines whether or not the z-translation is disabled on the widget                                                                                        | `boolean`                                                                     | `false`         |


## Events

| Event                | Description                                                         | Type                                                                                                                                                         |
| -------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `interactionEnded`   | An event that is emitted when the interaction has ended             | `CustomEvent<[number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number] \| undefined>` |
| `interactionStarted` | An event that is emitted an interaction with the widget has started | `CustomEvent<void>`                                                                                                                                          |
| `positionChanged`    | An event that is emitted when the position of the widget changes.   | `CustomEvent<Vector3 \| undefined>`                                                                                                                          |
| `rotationChanged`    | An event that is emitted when the rotation of the widget changes.   | `CustomEvent<Euler \| undefined>`                                                                                                                            |


## CSS Custom Properties

| Name                                            | Description                                                                               |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `--viewer-transform-widget-hovered-arrow-color` | A CSS color for the arrow when it is hovered. Defaults to `#ffff00`.                      |
| `--viewer-transform-widget-input-width`         | A CSS length for the width of the input displayed near the handles. Defaults to `7em`.    |
| `--viewer-transform-widget-x-axis-arrow-color`  | A CSS color for the arrow at the end of the X axis on this widget. Defaults to `#ea3324`. |
| `--viewer-transform-widget-y-axis-arrow-color`  | A CSS color for the arrow at the end of the Y axis on this widget. Defaults to `#4faf32`. |
| `--viewer-transform-widget-z-axis-arrow-color`  | A CSS color for the arrow at the end of the Z axis on this widget. Defaults to `#0000ff`. |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
