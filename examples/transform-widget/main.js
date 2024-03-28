import { loadViewerWithQueryParams } from '../helpers.js';

const SELECTION_CORRELATION_ID = 'viewer-selection-correlation-id';

window.addEventListener('DOMContentLoaded', () => {
  main();
});

async function main() {
  await window.customElements.whenDefined('vertex-viewer');

  const viewer = document.querySelector('vertex-viewer');
  const widget = document.querySelector('vertex-viewer-transform-widget');

  await loadViewerWithQueryParams(viewer);

  const hideTransformWidget = () => {
    // Setting the widget position to `undefined` will hide it, but it can
    // also be conditionally rendered to remove it from the DOM entirely
    widget.position = undefined;
  }

  window.addEventListener('keydown', async (event) => {
    const scene = await viewer.scene();

    // Pressing `r` will reset the scene and remove applied transforms,
    // as well as hide the transform widget
    if (event.key === 'r') {
      await scene.reset({
        includeCamera: true,
      });
      
      hideTransformWidget();
    }
  });

  let nextWidgetPosition;

  viewer.addEventListener('tap', async (event) => {
    const { position } = event.detail;
    const scene = await viewer.scene();
    const raycaster = await scene.raycaster();

    const result = await raycaster.hitItems(position);

    if (result.hits && result.hits.length > 0) {
      const hit = result.hits[0];

      nextWidgetPosition = hit.hitPoint;
      hideTransformWidget();

      if (event.detail.shiftKey) {
        // If the shift key is pressed, add to the current selection without removing existing selection
        await scene
          .items((op) => op.where((q) => q.withItemId(hit.itemId.hex)).select())
          .execute({
            suppliedCorrelationId: SELECTION_CORRELATION_ID,
          });
      } else {
        // Select the part and deselect all other parts
        await scene
          .items((op) => [
            op.where((q) => q.all()).deselect(),
            op.where((q) => q.withItemId(hit.itemId.hex)).select(),
          ])
          .execute({
            suppliedCorrelationId: SELECTION_CORRELATION_ID,
          });
      }
    } else {
      // Deselect all parts since the user clicked in the empty space
      await scene
        .items((op) => [op.where((q) => q.all()).deselect()])
        .execute();

      nextWidgetPosition = undefined;
      hideTransformWidget();
    }
  });

  viewer.addEventListener('frameDrawn', async (event) => {
    if (
      event.detail.correlationIds.includes(SELECTION_CORRELATION_ID) &&
      nextWidgetPosition != null
    ) {
      // If the frame we received is a result of the selection performed,
      // display the transform widget at the position. This causes the appearance
      // of the widget to be more closely tied to the visual selection update
      widget.position = nextWidgetPosition;
    }
  });
}
