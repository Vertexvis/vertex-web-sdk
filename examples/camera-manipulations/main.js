import { loadViewerWithQueryParams } from '../helpers.js';
import { defineCustomElements } from 'https://cdn.jsdelivr.net/npm/@vertexvis/viewer@0.23.x/dist/esm/loader.mjs';
import { Vector3 } from 'https://cdn.jsdelivr.net/npm/@vertexvis/geometry@0.23.x/dist/cdn/bundle.esm.js';

document.addEventListener('DOMContentLoaded', () => {
  defineCustomElements(window).then(() => main());
});

// A bounding box that represents all the visible items in the scene. A future
// release of the SDK will handle this for you.
const visibleBoundingBox = {
  min: { x: -100, y: -100, z: -100 },
  max: { x: 100, y: 100, z: 100 },
};

async function main() {
  const viewer = document.querySelector('vertex-viewer');
  const viewAllBtn = document.querySelector('#view-all-btn');
  const fitToBoundingBoxBtn = document.querySelector(
    '#fit-to-bounding-box-btn'
  );
  const viewTopBtn = document.querySelector('#view-top-btn');
  const viewBottomBtn = document.querySelector('#view-bottom-btn');
  const viewLeftBtn = document.querySelector('#view-left-btn');
  const viewRightBtn = document.querySelector('#view-right-btn');
  const viewFrontBtn = document.querySelector('#view-front-btn');
  const viewBackBtn = document.querySelector('#view-back-btn');
  const viewFrontTopLeftBtn = document.querySelector(
    '#view-front-top-left-btn'
  );
  const viewFrontBottomLeftBtn = document.querySelector(
    '#view-front-bottom-left-btn'
  );

  await loadViewerWithQueryParams(viewer);

  viewAllBtn.addEventListener('click', viewAll(viewer));
  fitToBoundingBoxBtn.addEventListener('click', fitToBoundingBox(viewer));

  viewTopBtn.addEventListener('click', top(viewer));
  viewBottomBtn.addEventListener('click', bottom(viewer));
  viewLeftBtn.addEventListener('click', left(viewer));
  viewRightBtn.addEventListener('click', right(viewer));
  viewFrontBtn.addEventListener('click', front(viewer));
  viewBackBtn.addEventListener('click', back(viewer));
  viewFrontTopLeftBtn.addEventListener('click', frontTopLeft(viewer));
  viewFrontBottomLeftBtn.addEventListener('click', frontBottomLeft(viewer));
}

/**
 * Simulates a view all operation using the `visibleBoundingBox` variable. The
 * visible bounding box represents a box that surrounds all the visible parts
 * in the scene.
 *
 * Currently, this needs to be externally supplied, but an upcoming release will
 * have this be handled by the SDK.
 */
function viewAll(viewer) {
  return async () => {
    const scene = await viewer.scene();
    await scene.camera().fitToBoundingBox(visibleBoundingBox).render();
  };
}

/**
 * Fits the camera to a bounding box. This can be used for fit to part
 * interactions.
 */
function fitToBoundingBox(viewer) {
  return async () => {
    const scene = await viewer.scene();
    const boundingBox = {
      min: { x: -50, y: -50, z: -50 },
      max: { x: 50, y: 50, z: 50 },
    };
    await scene.camera().fitToBoundingBox(boundingBox).render();
  };
}

/**
 * A helper to apply a standard view to the viewer. Pass in an instance of the
 * viewer, and an object that represents the camera's position and up vector.
 */
function standardView(viewer, camera) {
  return async () => {
    const scene = await viewer.scene();
    await scene
      .camera()
      .update(camera)
      .fitToBoundingBox(visibleBoundingBox)
      .render();
  };
}

/**
 * Updates the camera of the scene to view the top of the model.
 */
function top(viewer) {
  return standardView(viewer, {
    position: Vector3.up(),
    lookAt: Vector3.origin(),
    up: Vector3.forward(),
  });
}

/**
 * Updates the camera of the scene to view the bottom of the model.
 */
function bottom(viewer) {
  return standardView(viewer, {
    position: Vector3.down(),
    lookAt: Vector3.origin(),
    up: Vector3.back(),
  });
}

/**
 * Updates the camera of the scene to view the front of the model.
 */
function front(viewer) {
  return standardView(viewer, {
    position: Vector3.back(),
    lookAt: Vector3.origin(),
    up: Vector3.up(),
  });
}

/**
 * Updates the camera of the scene to view the back of the model.
 */
function back(viewer) {
  return standardView(viewer, {
    position: Vector3.forward(),
    lookAt: Vector3.origin(),
    up: Vector3.up(),
  });
}

/**
 * Updates the camera of the scene to view the left side of the model.
 */
function left(viewer) {
  return standardView(viewer, {
    position: Vector3.left(),
    lookAt: Vector3.origin(),
    up: Vector3.up(),
  });
}

/**
 * Updates the camera of the scene to view the right side of the model.
 */
function right(viewer) {
  return standardView(viewer, {
    position: Vector3.right(),
    lookAt: Vector3.origin(),
    up: Vector3.up(),
  });
}

function frontTopLeft(viewer) {
  return standardView(viewer, {
    position: Vector3.add(Vector3.back(), Vector3.up(), Vector3.left()),
    lookAt: Vector3.origin(),
    up: Vector3.up(),
  });
}

function frontBottomLeft(viewer) {
  return standardView(viewer, {
    position: Vector3.add(Vector3.back(), Vector3.down(), Vector3.left()),
    lookAt: Vector3.origin(),
    up: Vector3.up(),
  });
}
