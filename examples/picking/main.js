import { loadViewerWithQueryParams } from '../helpers.js';
import { ColorMaterial } from 'https://unpkg.com/@vertexvis/viewer@0.17.x/dist/esm/index.mjs';
import { defineCustomElements } from 'https://unpkg.com/@vertexvis/viewer@0.17.x/dist/esm/loader.mjs';

document.addEventListener('DOMContentLoaded', () => {
  defineCustomElements(window).then(() => main());
});

async function main() {
  const viewer = document.querySelector('vertex-viewer');
  await loadViewerWithQueryParams(viewer);

  viewer.addEventListener('tap', async (event) => {
    const { position } = event.detail;
    const scene = await viewer.scene();
    const raycaster = await scene.raycaster();

    const result = await raycaster.hitItems(position);

    if (result.hits && result.hits.length == 0) {
      await scene
        .items((op) => op.where((q) => q.all()).clearMaterialOverrides())
        .execute();
    } else {
      await scene
        .items((op) => [
          op.where((q) => q.all()).clearMaterialOverrides(),
          op
            .where((q) => q.withItemId(result.hits[0].itemId.hex))
            .materialOverride(ColorMaterial.fromHex('#ff0000')),
        ])
        .execute();
    }
  });
}
