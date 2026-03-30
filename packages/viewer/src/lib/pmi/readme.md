# PmiController

The `PmiController` is a controller for accessing Product Manufacturing Information (PMI) 
annotations associated with a model view. PMI annotations represent dimensions, tolerances,
surface finishes, welding symbols, and other manufacturing instructions. This controller is 
available as a read-only property on the `<vertex-viewer>` element after the viewer has connected to a scene.

## Listing PMI Annotations

The `listAnnotations` method fetches a paginated list of PMI annotations. Each
page includes a cursor that can be used to retrieve the next page of results.
Annotations can optionally be scoped to a specific model view.

**Example:** Fetching the first page of annotations.

```html
<html>
  <body>
    <vertex-viewer id="viewer" src="urn:vertex:stream-key:my-key"></vertex-viewer>

    <script type="module">
      async function main() {
        const viewer = document.querySelector('#viewer');

        viewer.addEventListener('sceneReady', async () => {
          const modelViewId = 'model-view-id';
          const response = await viewer.pmi.listAnnotations({ modelViewId });

          // `listAnnotations` returns an object containing an array of `PmiAnnotation`s (`response.annotations`),
          // along with paging data (`paging`). Each `PmiAnnotation` object will contain an `id` and `displayName`.
          console.log(response.annotations.map((a) => `${a.displayName}: ${a.id}`));
        });
      }

      main();
    </script>
  </body>
</html>
```

### Pagination

As mentioned above, annotations returned by the `listAnnotations` method are paginated, and the `cursor`
present on each response can be used to fetch the next page of data. The size of the page retrieved
by this method can also be configured using the `size` option (default page size is 50).

**Example:** Fetching the next page of annotations.

```html
<html>
  <body>
    <vertex-viewer id="viewer" src="urn:vertex:stream-key:my-key"></vertex-viewer>

    <script type="module">
      async function main() {
        const viewer = document.querySelector('#viewer');
        
        viewer.addEventListener('sceneReady', async () => {
          const modelViewId = 'model-view-id';

          const firstPageResponse = await viewer.pmi.listAnnotations({
            modelViewId,
            size: 25,
          });
          const secondPageResponse = await viewer.pmi.listAnnotations({
            modelViewId,
            cursor: firstPageResponse.paging.next,
            size: 25,
          });

          console.log('First Page:', firstPageResponse.annotations.map((a) => `${a.displayName}: ${a.id}`));
          console.log('Second Page:', secondPageResponse.annotations.map((a) => `${a.displayName}: ${a.id}`));
        });
      }

      main();
    </script>
  </body>
</html>
```

## Combining with Model Views

Typically, the `listAnnotations` method is combined with the `listByItem` method of the [model view
controller][model-view-controller]. In this workflow, model views are listed for an individual scene
item, and the annotations for an individual model view are retrieved so they can be interacted on. 
PMI annotations currently support being selected, shown, or hidden.

**Example:** Listing model views and interacting with the annotations for a single model view.

```html
<html>
  <body>
    <vertex-viewer id="viewer" src="urn:vertex:stream-key:my-key"></vertex-viewer>

    <script type="module">
      async function main() {
        const viewer = document.querySelector('#viewer');
        
        const sceneItemId = 'scene-item-id';

        viewer.addEventListener('sceneReady', async () => {
          const modelViewsResponse = await viewer.modelViews.listByItem(sceneItemId, {
            hasAnnotations: true,
          });

          // Load a model view and select the first annotation present
          if (modelViewsResponse.modelViews.length > 0) {
            const modelView = modelViewsResponse.modelViews[0];

            await viewer.modelViews.load(sceneItemId, modelView.id);

            const pmiResponse = await viewer.pmi.listAnnotations({
              modelViewId: modelView.id,
            });

            if (pmiResponse.annotations.length > 0) {
              const annotation = pmiResponse.annotations[0];

              const scene = await viewer.scene();
              await scene
                .elements((op) =>
                  op.annotations
                    .where((q) => q.withAnnotationId(annotation.id))
                    .select()
                )
                .execute();
            }
          }
        });
      }

      main();
    </script>
  </body>
</html>
```

## Performing operations through the Viewer

When a model view is loaded, its associated annotations will also be displayed in the 3D viewer.
These annotations can be interacted with in a similar manner to visible geometry in the scene.
Using the `tap` event on the viewer along with the scene's `raycaster`. When a hit request is made,
the associated `Hit` will include an `annotationId` which can be used to perform operations on
the annotation.

**Example:** Loading a model view and selecting an annotation through the viewer.

```html
<html>
  <body>
    <vertex-viewer id="viewer" src="urn:vertex:stream-key:my-key"></vertex-viewer>

    <script type="module">
      async function main() {
        const viewer = document.querySelector('#viewer');
        
        const sceneItemId = 'scene-item-id';

        viewer.addEventListener('tap', async (event) => {
          const { position } = event.detail;
          const scene = await viewer.scene();
          const raycaster = await scene.raycaster();

          const result = await raycaster.hitItems(position);

          if (result.hits && result.hits.length > 0 && result.hits[0].annotationId != null) {
            const hit = result.hits[0];

            const scene = await viewer.scene();
            await scene
              .elements((op) =>
                op.annotations
                  .where((q) => q.withAnnotationId(hit.annotationId.hex))
                  .select()
              )
              .execute();
          }
        });

        viewer.addEventListener('sceneReady', async () => {
          const modelViewsResponse = await viewer.modelViews.listByItem(sceneItemId, {
            hasAnnotations: true,
          });

          if (modelViewsResponse.modelViews.length > 0) {
            const modelView = modelViewsResponse.modelViews[0];

            await viewer.modelViews.load(sceneItemId, modelView.id);
          }
        });
      }

      main();
    </script>
  </body>
</html>
```

[model-view-controller]: ../model-views/readme.md
