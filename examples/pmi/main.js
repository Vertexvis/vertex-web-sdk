import { loadViewerWithQueryParams } from '../helpers.js';
import { createModelViewListItem } from './dom.js';
import { selectFromViewer } from './operations.js';

const SCENE_ITEM_ID = 'ee959628-b9a2-4b46-aa51-8646929468d1';

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
    streamKey: '7jad6i-cr4cQiFNlOzHdhzRj-KnkrKKa-_ED',
    env: 'platdev',
  });
}
