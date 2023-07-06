window.addEventListener('DOMContentLoaded', () => {
  main();
});

async function main() {
  await window.customElements.whenDefined('vertex-viewer');
  const viewer = document.querySelector('vertex-viewer');

  window.addEventListener('keydown', async (event) => {
    const scene = await viewer.scene();

    // press 'e' to set end item state
    if (event.key === 'e') {
      console.log('setting end item state');
      await scene
        .items((op) => op.where((q) => q.withSelected()).setEndItem(true))
        .execute();
    }

    // press 'r' to reset end item state
    if (event.key === 'r') {
      console.log('resetting end item state');
      await scene
        .items((op) => op.where((q) => q.all()).clearEndItem())
        .execute();
    }
  });

  viewer.addEventListener('tap', async (event) => {
    const { position } = event.detail;
    const scene = await viewer.scene();
    const raycaster = await scene.raycaster();

    const result = await raycaster.hitItems(position);

    console.log(result);
    if (result.hits && result.hits.length > 0) {
      const hit = result.hits[0];

      await scene
        .items((op) => [
          op.where((q) => q.all()).deselect(),
          op.where((q) => q.withItemId(hit.itemId.hex)).select(),
        ])
        .execute();
    } else {
        await scene
        .items((op) => [
          op.where((q) => q.all()).deselect(),
        ])
        .execute();
    }
  });
}