import { loadViewerWithQueryParams } from '../helpers.js';

window.addEventListener('DOMContentLoaded', () => {
  main();
});

async function main() {
  await window.customElements.whenDefined('vertex-viewer');
  const viewer = document.querySelector('vertex-viewer');

  await loadViewerWithQueryParams(viewer);

  window.addEventListener('keydown', async (event) => {
    const scene = await viewer.scene();

    // press 'space' to deselect all parts
    if (event.key === ' ') {
      await scene
        .elements((op) => op.where((q) => q.all()).deselect())
        .execute();
    }
  });

  let lastSelectedId;

  viewer.addEventListener('tap', async (event) => {
    const { position } = event.detail;
    const scene = await viewer.scene();
    const raycaster = await scene.raycaster();

    const result = await raycaster.hitItems(position);

    if (result.hits && result.hits.length > 0) {
      const hit = result.hits[0];

      if (event.detail.shiftKey) {
        // If the shift key is pressed, add to the current selection without removing existing selection
        await scene
            .elements((op) => op.where((q) => q.withItemId(hit.itemId.hex)).select())
            .execute();
      } else {
        const ancestors = hit.ancestors.reverse();
        const indexOfLastSelectedPartInAncestors = ancestors.findIndex((a) => a.itemId.hex === lastSelectedId);
        const indexOfAncestorToSelect = indexOfLastSelectedPartInAncestors + 1;

        if (hit.itemId.hex === lastSelectedId || (indexOfAncestorToSelect > 0 && indexOfAncestorToSelect < ancestors.length)) {
            // If the part is already selected, then select the item's parent
            const toSelectId = ancestors[indexOfLastSelectedPartInAncestors + 1].itemId.hex;

            await scene
                .elements((op) => [
                  op.where((q) => q.all()).deselect(),
                  op.where((q) => q.withItemId(toSelectId)).select(),
                ])
                .execute();

            lastSelectedId = toSelectId;
        } else {
            // Select the part and deselect all other parts
            await scene
                .elements((op) => [
                  op.where((q) => q.all()).deselect(),
                  op.where((q) => q.withItemId(hit.itemId.hex)).select(),
                ])
                .execute();

            lastSelectedId = hit.itemId.hex;
        }
      }
    } else {
      // Deselect all parts since the user clicked in the empty space
      await scene
        .elements((op) => [op.where((q) => q.all()).deselect()])
        .execute();

      lastSelectedId = "";
    }
  });
}
