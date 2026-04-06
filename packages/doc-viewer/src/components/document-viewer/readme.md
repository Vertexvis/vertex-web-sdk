# vertex-document-viewer



<!-- Auto Generated Below -->


## Properties

| Property          | Attribute          | Description                                                                                                                                                                     | Type                            | Default               |
| ----------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- | --------------------- |
| `documentState`   | --                 | Common state of the current document. This value includes information common to all types of documents, including state like zoom percentage, viewport definition, and offsets. | `DocumentApiState \| undefined` | `undefined`           |
| `interactionMode` | `interaction-mode` | The interaction mode for the viewer. When set to `'pan'`, click and drag will pan the document. When set to `'none'`, no pointer interactions are registered.                   | `"none" \| "pan"`               | `'pan'`               |
| `provider`        | --                 | The provider used to create the document API and renderer.                                                                                                                      | `DocumentProvider`              | `new PdfJsProvider()` |
| `resizeDebounce`  | `resize-debounce`  | An optional value that will debounce image updates when resizing this viewer element.                                                                                           | `number`                        | `100`                 |
| `src`             | `src`              | A URI of the document to load when the component is mounted in the DOM tree. Currently only supports URLs for client-side rendering.                                            | `string \| undefined`           | `undefined`           |


## Methods

### `loadPage(pageNumber: number) => Promise<void>`

Loads a specific page of the currently loaded document.

Note that any offset applied by panning the document will be reset when loading
a new page.

#### Parameters

| Name         | Type     | Description              |
| ------------ | -------- | ------------------------ |
| `pageNumber` | `number` | The page number to load. |

#### Returns

Type: `Promise<void>`



### `panByDelta(delta: Point.Point) => Promise<void>`

Pans the currently loaded document by the specified delta.

This method will be bounded to the visible portion of the document to ensure
at least a portion of the document is always visible, and the `canvas` does not
appear blank.

#### Parameters

| Name    | Type    | Description                       |
| ------- | ------- | --------------------------------- |
| `delta` | `Point` | The delta to pan the document by. |

#### Returns

Type: `Promise<void>`



### `zoomTo(percentage: number) => Promise<void>`

Zooms the currently loaded document to the specified zoom percentage.

This method will automatically adjust existing offsets to maintain the
same center point of the document where possible.

#### Parameters

| Name         | Type     | Description                 |
| ------------ | -------- | --------------------------- |
| `percentage` | `number` | The zoom percentage to set. |

#### Returns

Type: `Promise<void>`




----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
