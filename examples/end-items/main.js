window.addEventListener('DOMContentLoaded', () => {
  main();
});

async function main() {
  await window.customElements.whenDefined('vertex-viewer');
  const viewer = document.querySelector('vertex-viewer');

  window.addEventListener('keydown', async (event) => {
    const scene = await viewer.scene();

    // press 'e' to set end item state as true
    if (event.key === 'e') {
      console.log('setting end item state');
      await scene
        .elements((op) => op.items.where((q) => q.withSelected()).setEndItem(true))
        .execute();
    }

    // press 'r' to set end item state as false
    if (event.key === 'r') {
      console.log('removing end item state');
      await scene
        .elements((op) => op.items.where((q) => q.withSelected()).setEndItem(false))
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

      // If the shift key is pressed, select the item's parent
      if (event.detail.shiftKey && hit.ancestors.length > 0) {
        const ancestors = hit.ancestors.reverse();
        const toSelectId =
          ancestors[ancestors.findIndex((a) => a.itemId.hex === lastSelectedId) + 1]
            .itemId.hex;

        await scene
            .elements((op) => [
              op.items.where((q) => q.all()).deselect(),
              op.items.where((q) => q.withItemId(toSelectId)).select(),
            ])
            .execute();

        lastSelectedId = toSelectId;
      } else {
        await scene
            .elements((op) => [
              op.items.where((q) => q.all()).deselect(),
              op.items.where((q) => q.withItemId(hit.itemId.hex)).select(),
            ])
            .execute();
        lastSelectedId = hit.itemId.hex;
      }
    } else {
      await scene
        .elements((op) => [op.items.where((q) => q.all()).deselect()])
        .execute();
    }
  });
}