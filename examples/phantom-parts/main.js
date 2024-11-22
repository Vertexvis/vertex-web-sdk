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

    // press 'r' to reset phantom state
    if (event.key === 'r') {
      await scene
        .elements((op) => op.items.where((q) => q.all()).clearPhantom())
        .execute();
    }
  });

  viewer.addEventListener('tap', async (event) => {
    const { position } = event.detail;
    const scene = await viewer.scene();
    const raycaster = await scene.raycaster();

    const result = await raycaster.hitItems(position);

    if (result.hits && result.hits.length !== 0) {
      const hit = result.hits[0];

      await scene
        .elements((op) => [
          op.items.where((q) => q.withItemId(hit.itemId.hex)).setPhantom(true),
        ])
        .execute();
    }
  });
}
