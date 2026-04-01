import { loadViewerWithQueryParams } from '../helpers.js';
import { createModelViewListItem } from './dom.js';
import { selectFromViewer } from './operations.js';

const SCENE_ITEM_ID = '151d4b91-5901-4ef0-a9a1-577291a853c4';

window.addEventListener('DOMContentLoaded', () => {
  main();
});

async function main() {
  await window.customElements.whenDefined('vertex-viewer');
  const viewer = document.querySelector('vertex-viewer');
  const instructionsCloseButton = document.getElementById('instructions-close');

  viewer.addEventListener('sceneReady', async () => {
    // Load all model views for the scene item, and display them in the model view list.
    const modelViewsResponse = await viewer.modelViews.listByItem(SCENE_ITEM_ID);

    modelViewsResponse.modelViews.forEach((modelView) => {
      createModelViewListItem(modelView, SCENE_ITEM_ID);
    });
  });

  viewer.addEventListener('tap', async (event) => {
    const { position } = event.detail;

    await selectFromViewer(position);
  });

  instructionsCloseButton.addEventListener('click', () => {
    document.getElementById('instructions').remove();
  });

  await loadViewerWithQueryParams(viewer, {
    streamKey: 'X7mxgqyT9zBMRpOmb-P3N_sIMhCK1QlPVmsT',
    env: 'platprod',
  });
}
