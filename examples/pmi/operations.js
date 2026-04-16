import { addAnnotationSelectedClass, clearAnnotationSelectionClasses } from './dom.js';

// Helpers for performing operations on PMI annotations and scene items.

/**
 * Selects the PMI annotation with the provided ID, and deselects all other annotations.
 */
export async function selectAnnotation(annotationId) {
  const scene = await viewer.scene();

  await scene
    .elements((op) => [
      op.annotations.where((q) => q.all()).deselect(),
      op.annotations.where((q) => q.withAnnotationId(annotationId)).select(),
    ])
    .execute();
}

/**
 * Updates the visibility of the PMI annotation with the provided ID based on the
 * provided `visible` flag.
 */
export async function updateAnnotationVisibility(annotationId, visible) {
  const scene = await viewer.scene(); 

  if (visible) {
    await scene
      .elements((op) => [
        op.annotations
          .where((q) => q.withAnnotationId(annotationId))
          .hide(),
      ])
      .execute();
  } else {
    await scene
      .elements((op) => [
        op.annotations
          .where((q) => q.withAnnotationId(annotationId))
          .show(),
      ])
      .execute();
  }
}

/**
 * Performs a raycast at the provided position, and performs a few different actions
 * based on the result of the raycast.
 * 
 * If the raycast hits a PMI annotation, the annotation is selected, and all other annotations are deselected.
 * If the raycast hits a scene-item, the item is selected, and all other items are deselected.
 * If the raycast hits nothing, all annotations and items are deselected.
 */
export async function selectFromViewer(position) {
  const scene = await viewer.scene();
  const raycaster = await scene.raycaster();

  const result = await raycaster.hitItems(position);

  if (
    result.hits &&
    result.hits.length > 0 &&
    result.hits[0].annotationId != null
  ) {
    const hit = result.hits[0];
    const annotationId = hit.annotationId.hex;
    const scene = await viewer.scene();

    addAnnotationSelectedClass(annotationId);
    await scene
      .elements((op) => [
        op.annotations.where((q) => q.all()).deselect(),
        op.annotations
          .where((q) => q.withAnnotationId(hit.annotationId.hex))
          .select(),
      ])
      .execute();
  } else if (
    result.hits &&
    result.hits.length > 0 &&
    result.hits[0].itemId != null
  ) {
    const hit = result.hits[0];
    const scene = await viewer.scene();

    await scene
      .elements((op) => [
        op.items.where((q) => q.all()).deselect(),
        op.items.where((q) => q.withItemId(hit.itemId.hex)).select(),
      ])
      .execute();
  } else {
    const scene = await viewer.scene();

    clearAnnotationSelectionClasses();
    await Promise.all([
      scene
        .elements((op) => [op.items.where((q) => q.all()).deselect()])
        .execute(),
      scene
        .elements((op) => [op.annotations.where((q) => q.all()).deselect()])
        .execute(),
    ]);
  }
}