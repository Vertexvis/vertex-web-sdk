import { selectAnnotation, updateAnnotationVisibility } from './operations.js';

// Helpers for managing DOM elements associated to loaded model views and PMI annotations.

/**
 * Creates a list item for a model view, and appends it to the DOM.
 * The list item is a button that will load a specific model view when it is clicked,
 * as well as load all the PMI annotations associated with that model view.
 */
export function createModelViewListItem(modelView, sceneItemId) {
  const modelViewList = document.getElementById('model-view-list');
  const modelViewListItem = document.createElement('button');

  modelViewListItem.id = modelView.id;
  modelViewListItem.textContent = modelView.displayName;
  modelViewListItem.classList.add('model-view-list-item');

  modelViewListItem.addEventListener('click', async () => {
    const annotationList = document.getElementById('annotation-list');
    
    addModelViewSelectedClass(modelView.id);
    showLoadingLayer();
    // Loads the specified model view into the viewer.
    await viewer.modelViews.load(sceneItemId, modelView.id);

    // Load all PMI annotations for the model view, and display them in the annotation list.
    const annotationsResponse = await viewer.pmi.listAnnotations({
      modelViewId: modelView.id,
    });
    annotationList.childNodes.forEach((child) => {
      child.remove();
    });
    annotationsResponse.annotations.forEach((annotation) => {
      createAnnotationListItem(annotation);
    });
    hideLoadingLayer();
  });
  
  modelViewList.appendChild(modelViewListItem);
}

/**
 * Creates a list item for a PMI annotation, and appends it to the DOM.
 * The list item is composed of two buttons, one for selecting the annotation,
 * and one for toggling the visibility of the annotation.
 */
export function createAnnotationListItem(annotation) {
  const annotationList = document.getElementById('annotation-list');
  const annotationListItem = document.createElement('div');
  const annotationListItemSelectButton = document.createElement('button');
  const annotationListItemVisibilityButton = document.createElement('button');
  const annotationListItemVisibilityIcon =
    document.createElement('vertex-viewer-icon');

  annotationListItem.id = annotation.id;
  annotationListItem.classList.add('annotation-list-item');
  annotationListItemSelectButton.classList.add('annotation-list-item-select-button');
  annotationListItemSelectButton.textContent = annotation.displayName;
  annotationListItemVisibilityIcon.setAttribute('name', 'eye-open');
  annotationListItemVisibilityIcon.setAttribute('size', 'sm');

  annotationListItemSelectButton.addEventListener('click', async () => {
    addAnnotationSelectedClass(annotation.id);
    await selectAnnotation(annotation.id);
  });
  annotationListItemVisibilityButton.addEventListener('click', async () => {
    await handleToggleAnnotationVisibility(annotation.id);
  });

  annotationListItemVisibilityButton.appendChild(
    annotationListItemVisibilityIcon
  );
  annotationListItem.appendChild(annotationListItemSelectButton);
  annotationListItem.appendChild(annotationListItemVisibilityButton);
  annotationList.appendChild(annotationListItem);
}

/**
 * Removes all instances of the 'selected' class from all annotation list items.
 */
export function clearAnnotationSelectionClasses() {
  const annotationList = document.getElementById('annotation-list');

  annotationList.querySelectorAll('.annotation-list-item').forEach((button) => {
    button.classList.remove('selected');
  });
}

/**
 * Adds the 'selected' class to the annotation list item with the provided ID.
 */
export function addAnnotationSelectedClass(annotationId) {
  const annotationListItem = document.getElementById(annotationId);

  clearAnnotationSelectionClasses();
  annotationListItem.classList.add('selected');
}

/**
 * Removes all instances of the 'selected' class from all model view list items.
 */
export function clearModelViewSelectionClasses() {
  const modelViewList = document.getElementById('model-view-list');

  modelViewList.querySelectorAll('button').forEach((button) => {
    button.classList.remove('selected');
  });
}

/**
 * Adds the 'selected' class to the model view list item with the provided ID.
 */
export function addModelViewSelectedClass(modelViewId) {
  const modelViewListItem = document.getElementById(modelViewId);

  clearModelViewSelectionClasses();
  modelViewListItem.classList.add('selected');
}

/**
 * Shows a loading spinner over the viewer while a model view is being loaded.
 */
export function showLoadingLayer() {
  const loadingLayer = document.getElementById('loading-layer');
  
  loadingLayer.classList.add('visible');
}

/**
 * Hides the loading spinner from the viewer.
 */
export function hideLoadingLayer() {
  const loadingLayer = document.getElementById('loading-layer');

  loadingLayer.classList.remove('visible');
}

/**
 * Handler for changing the visibility of a PMI annotation. This function will
 * inspect the current icon displayed, and determine whether to hide or show the
 * annotation, then update the icon to reflect the new visibility state.
 */
const handleToggleAnnotationVisibility = async (annotationId) => {
  const annotationListItem = document.getElementById(annotationId);
  const annotationListItemVisibilityIcon =
    annotationListItem.querySelector('vertex-viewer-icon');

  const visible =
    annotationListItemVisibilityIcon.getAttribute('name') === 'eye-open';

  await updateAnnotationVisibility(annotationId, visible);

  annotationListItemVisibilityIcon.setAttribute(
    'name',
    visible ? 'eye-half' : 'eye-open'
  );
};