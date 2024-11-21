import { TransformationDelta } from 'https://cdn.jsdelivr.net/npm/@vertexvis/viewer@0.22.x/dist/esm/index.mjs';
import { loadViewerWithQueryParams } from '../helpers.js';

window.addEventListener('DOMContentLoaded', () => {
  main();
});

async function main() {
  await window.customElements.whenDefined('vertex-viewer');
  const viewer = document.querySelector('vertex-viewer');

  await loadViewerWithQueryParams(viewer);

  let hit1 = undefined;
  let hit2 = undefined;

  function resetIndicators() {
    const indicator = document.getElementById('indicator-1');

    const indicator2 = document.getElementById('indicator-2');
    indicator.position = undefined;
    indicator.normal = undefined;

    indicator2.position = undefined;
    indicator2.normal = undefined;

    hit1 = undefined;
    hit2 = undefined;
  }

  window.addEventListener('keydown', async (event) => {
    const transformWidget = document.getElementById('transform-widget');
    // press 'a' to align
    if (event.key === 'a') {
      if (hit1 != null && hit2 != null) {
        const translationDelta = TransformationDelta.computeTransformationDelta(
          hit1.hitNormal,
          hit1.hitPoint,
          hit2.hitNormal,
          hit2.hitPoint
        );
        transformWidget.controller?.beginTransform();
        transformWidget.controller?.updateTransform(translationDelta);
        transformWidget.controller?.endTransform();
      }
    }
    // press 'f' to flip normals
    else if (event.key === 'f') {
      const translationDelta = TransformationDelta.computeTransformationDelta(
        hit2.hitNormal,
        hit2.hitPoint,
        hit2.hitNormal,
        hit2.hitPoint
      );

      transformWidget.controller?.beginTransform();
      transformWidget.controller?.updateTransform(translationDelta);
      transformWidget.controller?.endTransform();
    }

    // press 'r' to reload
    else if (event.key === 'r') {
      window?.location.reload();
    }
  });

  viewer.addEventListener('tap', async (event) => {
    const { position } = event.detail;
    const scene = await viewer.scene();
    const raycaster = await scene.raycaster();

    const result = await raycaster.hitItems(position);

    if (result.hits && result.hits.length == 0) {
      await scene.elements((op) => op.items.where((q) => q.all()).deselect()).execute();

      resetIndicators();
    } else if (hit1 != null) {
      const indicator = document.getElementById('indicator-2');
      hit2 = result.hits[0];
      indicator.position = hit2.hitPoint;
      indicator.normal = hit2.hitNormal;
    } else {
      const hit = result.hits[0];

      const indicator = document.getElementById('indicator-1');
      indicator.position = hit.hitPoint;
      indicator.normal = hit.hitNormal;

      hit1 = hit;
      await scene
        .elements((op) => [
          op.items.where((q) => q.all()).deselect(),
          op.items.where((q) => q.withItemId(hit.itemId.hex)).select(),
        ])
        .execute();
    }
  });
}
