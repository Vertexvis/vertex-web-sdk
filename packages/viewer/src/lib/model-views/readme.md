# ModelViewController

The `ModelViewController` is a controller for retrieving and interacting with
the model views associated to a scene item. This controller is available as a
read-only property on the `<vertex-viewer>` element after the viewer has connected 
to a scene.

## Listing Model Views for an Item

The `listByItem` method fetches a paginated list of model views for a given
scene item. Each page includes a cursor that can be used to retrieve the next
page of results.

**Example:** Fetching the first page of model views for an item.

```html
<html>
  <body>
    <vertex-viewer id="viewer" src="urn:vertex:stream-key:my-key"></vertex-viewer>

    <script type="module">
      async function main() {
        const viewer = document.querySelector('#viewer');

        const sceneItemId = 'scene-item-id';
        const response = await viewer.modelViews.listByItem(sceneItemId);

        // `listByItem` returns an object containing an array of `ModelView`s (`response.modelViews`),
        // along with paging data (`paging`). Each `ModelView` object will contain an `id` and `displayName`.
        console.log(response.modelViews.map((mv) => `${mv.displayName}: ${mv.id}`));
      }

      main();
    </script>
  </body>
</html>
```

### Pagination

As mentioned above, model views returned by the `listByItem` method are paginated, and the `cursor`
present on each response can be used to fetch the next page of data. The size of the page retrieved
by this method can also be configured using the `size` option (default page size is 50).

**Example:** Fetching the next page of model views.

```html
<html>
  <body>
    <vertex-viewer id="viewer" src="urn:vertex:stream-key:my-key"></vertex-viewer>

    <script type="module">
      async function main() {
        const viewer = document.querySelector('#viewer');

        const sceneItemId = 'scene-item-id';
        const firstPageResponse = await viewer.modelViews.listByItem(sceneItemId, {
          size: 25,
        });
        const secondPageResponse = await viewer.modelViews.listByItem(sceneItemId, {
          cursor: firstPageResponse.paging.next,
          size: 25,
        });

        console.log('First Page:', firstPageResponse.modelViews.map((mv) => `${mv.displayName}: ${mv.id}`));
        console.log('Second Page:', secondPageResponse.modelViews.map((mv) => `${mv.displayName}: ${mv.id}`));
      }

      main();
    </script>
  </body>
</html>
```

### Filtering by Annotation Presence

By default, all model views for a scene item will be returned by the `listByItem` endpoint, including
those that have no visible annotations. These model views without annotations are not always useful,
and can be filtered out using the `hasAnnotations` flag.

**Example:** Listing only model views that have annotations.

```html
<html>
  <body>
    <vertex-viewer id="viewer" src="urn:vertex:stream-key:my-key"></vertex-viewer>

    <script type="module">
      async function main() {
        const viewer = document.querySelector('#viewer');

        const sceneItemId = 'scene-item-id';
        const response = await viewer.modelViews.listByItem(sceneItemId, {
          hasAnnotations: true,
        });

        console.log(response.modelViews.map((mv) => `${mv.displayName}: ${mv.id}`));
      }

      main();
    </script>
  </body>
</html>
```

## Loading a Model View

The `load` method applies a model view to the current scene view. This will update the viewer 
to reflect the state captured by the model view, including camera orientation and annotations.

**Example:** Loading a model view.

```html
<html>
  <body>
    <vertex-viewer id="viewer" src="urn:vertex:stream-key:my-key"></vertex-viewer>

    <script type="module">
      async function main() {
        const viewer = document.querySelector('#viewer');

        const sceneItemId = 'scene-item-id';
        const response = await viewer.modelViews.listByItem(sceneItemId);

        if (response.modelViews.length > 0) {
          const modelView = response.modelViews[0];

          await viewer.modelViews.load(sceneItemId, modelView.id);
        }
      }

      main();
    </script>
  </body>
</html>
```

## Unloading a Model View

The `unload` method removes any previously loaded model view and resets the
scene to its initial state.

**Example:** Unloading the current model view.

```html
<html>
  <body>
    <vertex-viewer id="viewer" src="urn:vertex:stream-key:my-key"></vertex-viewer>
    <button id="unload">Unload Model View</button>

    <script type="module">
      async function main() {
        const viewer = document.querySelector('#viewer');
        const unload = document.querySelector('#unload');

        unload.addEventListener('click', viewer.modelViews.unload);

        // Load a model view using the previous example to be able to unload the model
        // when clicking `Unload Model View`.
        const sceneItemId = 'scene-item-id';
        const response = await viewer.modelViews.listByItem(sceneItemId);

        if (response.modelViews.length > 0) {
          const modelView = response.modelViews[0];

          await viewer.modelViews.load(sceneItemId, modelView.id);
        }
      }

      main();
    </script>
  </body>
</html>
```
