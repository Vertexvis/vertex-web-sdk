# vertex-document-viewer

<!-- Auto Generated Below -->


## Properties

| Property          | Attribute          | Description                                                                                                                                                                                                                                                                            | Type                                    | Default               |
| ----------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- | --------------------- |
| `config`          | --                 | Configuration values for the document viewer. See {@link Config } for more information on the available configuration options.                                                                                                                                                         | `Config \| undefined`                   | `undefined`           |
| `documentId`      | `document-id`      | The ID of the loaded `Document`. This ID is required to enable persistence of annotations.  Note that this is different than a `File` ID within the Vertex Platform, and must be created separately using the `/documents` endpoints. See https://docs.vertex3d.com/ for more details. | `string \| undefined`                   | `undefined`           |
| `documentState`   | --                 | Common state of the current document. This value includes information common to all types of documents, including state like zoom percentage, viewport definition, and offsets.                                                                                                        | `DocumentApiState \| undefined`         | `undefined`           |
| `interactionMode` | `interaction-mode` | The interaction mode for the viewer. When set to `'pan'`, click and drag will pan the document. When set to `'none'`, no pointer interactions are registered.                                                                                                                          | `"none" \| "pan"`                       | `'pan'`               |
| `layers`          | --                 | Controller for interacting with layers in the currently loaded document.  This controller will automatically be created along with the loaded document. Note that the methods available on this controller will only be supported if the underlying document type supports layers.     | `DocumentLayersController \| undefined` | `undefined`           |
| `provider`        | --                 | The provider used to create the document API and renderer.                                                                                                                                                                                                                             | `DocumentProvider`                      | `new PdfJsProvider()` |
| `resizeDebounce`  | `resize-debounce`  | An optional value that will debounce image updates when resizing this viewer element.                                                                                                                                                                                                  | `number`                                | `100`                 |
| `src`             | `src`              | A URI of the document to load when the component is mounted in the DOM tree. Currently only supports URLs for client-side rendering.                                                                                                                                                   | `string \| undefined`                   | `undefined`           |


## Events

| Event                  | Description                                                                                | Type                            |
| ---------------------- | ------------------------------------------------------------------------------------------ | ------------------------------- |
| `documentReady`        | Emits an event when the document is ready to be interacted with.                           | `CustomEvent<void>`             |
| `documentStateChanged` | Emits an event when the document state changes.                                            | `CustomEvent<DocumentApiState>` |
| `pageDrawn`            | Emits an event when a page has been drawn to the canvas.                                   | `CustomEvent<DocumentApiState>` |
| `pageLoaded`           | Emits an event when a page has been loaded or reloaded prior to being drawn to the canvas. | `CustomEvent<DocumentApiState>` |


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



### `registerInteractionHandler(interactionHandler: GeneralInteractionHandler) => Promise<Disposable>`

Registers and initializes an interaction handler with the document viewer. Returns a
`Disposable` that should be used to deregister the interaction handler.

`InteractionHandler`s are used to build custom mouse and touch interactions.

#### Parameters

| Name                 | Type                        | Description                          |
| -------------------- | --------------------------- | ------------------------------------ |
| `interactionHandler` | `GeneralInteractionHandler` | The interaction handler to register. |

#### Returns

Type: `Promise<Disposable>`

A promise containing the disposable to use to
deregister the handler.

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
