# vertex-viewer

<!-- Auto Generated Below -->


## Properties

| Property                          | Attribute                            | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Type                                        | Default                                            |
| --------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------- | -------------------------------------------------- |
| `annotations`                     | --                                   | The annotation controller for accessing annotations associated with the scene view.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `AnnotationController \| undefined`         | `undefined`                                        |
| `cameraControls`                  | `camera-controls`                    | Enables or disables the default mouse and touch interactions provided by the viewer. Enabled by default.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `boolean`                                   | `true`                                             |
| `cameraType`                      | `camera-type`                        | The type of camera model to represent the scene with. Can be either `perspective` or `orthographic`, and defaults to `perspective`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `"orthographic" \| "perspective"`           | `'perspective'`                                    |
| `clientId`                        | `client-id`                          | The Client ID associated with your Vertex Application.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | `string \| undefined`                       | `undefined`                                        |
| `config`                          | `config`                             | An object or JSON encoded string that defines configuration settings for the viewer.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | `Config \| string \| undefined`             | `undefined`                                        |
| `configEnv`                       | `config-env`                         | Sets the default environment for the viewer. This setting is used for auto-configuring network hosts.  Use the `config` property for manually setting hosts.                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | `"platdev" \| "platprod" \| "platstaging"`  | `'platprod'`                                       |
| `depthBuffers`                    | `depth-buffers`                      | Specifies when a depth buffer is requested from rendering. Possible values are:   * `undefined`: A depth buffer is never requested.  * `final`: A depth buffer is only requested on the final frame.  * `all`: A depth buffer is requested for every frame.  Depth buffers can increase the amount of data that's sent to a client and can impact rendering performance. Values of `undefined` or `final` should be used when needing the highest rendering performance. Some features, like measurement and pins, require that depth buffers are requested and will override an 'undefined' value when the feature is active. | `"all" \| "final" \| undefined`             | `undefined`                                        |
| `enableTemporalRefinement`        | `enable-temporal-refinement`         | Specifies whether to enable temporal refinement of still images.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | `boolean`                                   | `true`                                             |
| `experimentalSkipVisibilityCheck` | `experimental-skip-visibility-check` | Experimental flag indicating that connections to Vertex should be established if the viewer is initially hidden through its own style or computed style, or has not been scrolled into view.  *Caution:* Setting this flag can result in reduced performance, and should generally not be used in a production setting.                                                                                                                                                                                                                                                                                                        | `boolean`                                   | `false`                                            |
| `featureHighlighting`             | --                                   | Specifies how selected features should be highlighted.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | `FeatureHighlightOptions \| undefined`      | `undefined`                                        |
| `featureLines`                    | --                                   | Specifies if and how to render feature lines.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | `FeatureLineOptions \| undefined`           | `undefined`                                        |
| `featureMaps`                     | `feature-maps`                       | Specifies when a feature map is returned from rendering. Feature maps include information about the surfaces, edges and cross sections that are in a frame.  Possible values are:   * `undefined`: A feature map is never requested.  * `final`: A feature map is only requested on the final frame.  * `all`: A feature map is requested for every frame.  Feature maps can increase the amount of data that's sent to a client and can impact rendering performance. Values of `undefined` or `final` should be used when needing the highest rendering performance.                                                         | `"all" \| "final" \| undefined`             | `undefined`                                        |
| `frame`                           | --                                   | The last frame that was received, which can be used to inspect the scene and camera information.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | `Frame \| undefined`                        | `undefined`                                        |
| `keyboardControls`                | `keyboard-controls`                  | Enables or disables the default keyboard shortcut interactions provided by the viewer. Enabled by default, requires `cameraControls` being enabled.                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `boolean`                                   | `true`                                             |
| `modelViews`                      | --                                   | The controller for accessing model views associated with the scene view.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `ModelViewController \| undefined`          | `undefined`                                        |
| `noDefaultLights`                 | `no-default-lights`                  | Specifies whether to use the default lights for the scene. When false, default lights are used. When true, no default lights are used, and the lights must be specified separately.                                                                                                                                                                                                                                                                                                                                                                                                                                            | `boolean`                                   | `false`                                            |
| `phantom`                         | --                                   | Specifies how phantom parts should appear. The opacity must be between 0 and 1, where 0 is completely hidden and 1 is completely visible.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | `PhantomOptions \| undefined`               | `{ opacity: 0.1 }`                                 |
| `pmi`                             | --                                   | The controller for accessing and viewing PMI.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | `PmiController \| undefined`                | `undefined`                                        |
| `resizeDebounce`                  | `resize-debounce`                    | An optional value that will debounce frame updates when resizing this viewer element.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | `number`                                    | `100`                                              |
| `rotateAroundTapPoint`            | `rotate-around-tap-point`            | Sets the rotation interaction behavior. True by default.  When rotateAroundTapPoint is true and the user clicks on geometry, then the model will rotate around the point that was clicked. When rotateAroundTapPoint is true and the user clicks in empty space (not on geometry), then the model will rotate around the center of the viewport.  When rotateAroundTapPoint is false, then the model will always rotate around the center of the viewport.                                                                                                                                                                     | `boolean`                                   | `true`                                             |
| `sceneComparison`                 | --                                   | Specifies if and how to compare to another scene                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | `SceneComparisonOptions \| undefined`       | `undefined`                                        |
| `sceneItems`                      | --                                   | The controller for accessing and viewing SceneItems.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | `SceneItemController \| undefined`          | `undefined`                                        |
| `selectionHighlighting`           | --                                   | Specifies the halo selection properties. Parameter notes:  * lineWidth values supported currently are 0-5. This width is currently the value x2. For example, 1 will have a pixel width of 2.  * color is optional. This will be the color of the selected items in the viewer.  * opacity is also optional. The opacity will be applied to everything selected besides the highlighted outer line.                                                                                                                                                                                                                            | `SelectionHighlightingOptions \| undefined` | `undefined`                                        |
| `src`                             | `src`                                | A URN of the scene resource to load when the component is mounted in the DOM tree. The specified resource is a URN in the following format:   * `urn:vertex:scene:<sceneid>`                                                                                                                                                                                                                                                                                                                                                                                                                                                   | `string \| undefined`                       | `undefined`                                        |
| `viewport`                        | --                                   | Represents the current viewport of the viewer. The viewport represents the dimensions of the canvas where a frame is rendered. It contains methods for translating between viewport coordinates, frame coordinates and world coordinates.                                                                                                                                                                                                                                                                                                                                                                                      | `Viewport`                                  | `Viewport.fromDimensions(Dimensions.create(0, 0))` |


## Events

| Event                    | Description                                                                                                                                                                                                                                                        | Type                                                                                               |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `annotationStateChanged` | Emits an event when the state for annotation changes.                                                                                                                                                                                                              | `CustomEvent<AnnotationState>`                                                                     |
| `cameraTypeChanged`      | Emits an event when the camera type changes.                                                                                                                                                                                                                       | `CustomEvent<"orthographic" \| "perspective">`                                                     |
| `connectionChange`       | Emits an event when the connection status changes for the viewer                                                                                                                                                                                                   | `CustomEvent<ConnectedStatus \| ConnectingStatus \| ConnectionFailedStatus \| DisconnectedStatus>` |
| `dimensionschange`       |                                                                                                                                                                                                                                                                    | `CustomEvent<Dimensions>`                                                                          |
| `doubletap`              | Emits an event whenever the user double taps or clicks a location in the viewer. The event includes the location of the first tap or click.                                                                                                                        | `CustomEvent<TapEventDetails>`                                                                     |
| `frameDrawn`             | Emits an event when a frame has been drawn to the viewer's canvas. The event will include details about the drawn frame, such as the `Scene` information related to the scene.                                                                                     | `CustomEvent<Frame>`                                                                               |
| `frameReceived`          | Emits an event when a frame has been received by the viewer. The event will include details about the drawn frame, such as the `Scene` information related to the scene.                                                                                           | `CustomEvent<Frame>`                                                                               |
| `interactionFinished`    | Emits an event when the user hs finished an interaction.                                                                                                                                                                                                           | `CustomEvent<void>`                                                                                |
| `interactionStarted`     | Emits an event when the user has started an interaction.                                                                                                                                                                                                           | `CustomEvent<void>`                                                                                |
| `longpress`              | Emits an event whenever the user taps or clicks a location in the viewer and the configured amount of time passes without receiving a mouseup or touchend. The event includes the location of the tap or click.                                                    | `CustomEvent<TapEventDetails>`                                                                     |
| `sceneChanged`           | Emits an event when a frame is received with a different scene attribute.                                                                                                                                                                                          | `CustomEvent<void>`                                                                                |
| `sceneReady`             | Emits an event when the scene is ready to be interacted with.                                                                                                                                                                                                      | `CustomEvent<void>`                                                                                |
| `tap`                    | Emits an event whenever the user taps or clicks a location in the viewer. The event includes the location of the tap or click.  This event can be used in combination with the {@link VertexViewer.scene scene} method to query for items at the point of the tap. | `CustomEvent<TapEventDetails>`                                                                     |
| `tokenExpired`           | Emits an event when a provided oauth2 token is about to expire, or is about to expire, causing issues with establishing a websocket connection, or performing API calls.                                                                                           | `CustomEvent<void>`                                                                                |


## Methods

### `addCursor(cursor: Cursor, priority?: number | undefined) => Promise<Disposable>`

Adds a cursor to the viewer, and displays it if the cursor has the highest
priority.

Cursors are managed as a prioritized list. A cursor is displayed if it has
the highest priority or if the cursor is the most recently added cursor in
the set of cursors with the same priority.

To remove a cursor, call `dispose()` on the returned disposable.

#### Returns

Type: `Promise<Disposable>`

A disposable that can be used to remove the cursor.

### `getBaseInteractionHandler() => Promise<BaseInteractionHandler | undefined>`



#### Returns

Type: `Promise<BaseInteractionHandler | undefined>`



### `getInteractionHandlers() => Promise<InteractionHandler[]>`



#### Returns

Type: `Promise<InteractionHandler[]>`



### `getJwt() => Promise<string | undefined>`

<span style="color:red">**[DEPRECATED]**</span> Use `token`.<br/><br/>

#### Returns

Type: `Promise<string | undefined>`



### `isSceneReady() => Promise<boolean>`

Returns `true` indicating that the scene is ready to be interacted with.

#### Returns

Type: `Promise<boolean>`



### `load(urn: string, options?: LoadOptions | undefined) => Promise<void>`

Loads the given scene into the viewer and return a `Promise` that
resolves when the scene has been loaded. The specified scene is
provided as a URN in the following format:

 * `urn:vertex:scene:<sceneid>`

#### Returns

Type: `Promise<void>`



### `registerInteractionHandler(interactionHandler: InteractionHandler) => Promise<Disposable>`

Registers and initializes an interaction handler with the viewer. Returns a
`Disposable` that should be used to deregister the interaction handler.

`InteractionHandler`s are used to build custom mouse and touch interactions
for the viewer. Use `<vertex-viewer camera-controls="false" />` to disable
the default camera controls provided by the viewer.

#### Returns

Type: `Promise<Disposable>`

A promise containing the disposable to use to
deregister the handler.

### `registerTapKeyInteraction(keyInteraction: KeyInteraction<TapEventDetails>) => Promise<void>`

Registers a key interaction to be invoked when a specific set of
keys are pressed during a `tap` event.

`KeyInteraction`s are used to build custom keyboard shortcuts for the
viewer using the current state of they keyboard to determine whether
the `fn` should be invoked. Use `<vertex-viewer keyboard-controls="false" />`
to disable the default keyboard shortcuts provided by the viewer.

#### Returns

Type: `Promise<void>`



### `reload() => Promise<void>`

Disconnects the websocket and clears the internal state associated with
the scene before reconnecting to the same scene.

#### Returns

Type: `Promise<void>`



### `scene() => Promise<Scene>`

Returns an object that is used to perform operations on the `Scene` that's
currently being viewed. These operations include updating items,
positioning the camera and performing hit tests.

#### Returns

Type: `Promise<Scene>`



### `unload() => Promise<void>`

Disconnects the websocket and removes any internal state associated with
the scene.

#### Returns

Type: `Promise<void>`




## CSS Custom Properties

| Name                  | Description                                                                                                                                                                 |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--image-background`  | The background color of the rendered image. Defaults to `--viewer-background`.                                                                                              |
| `--viewer-background` | The background color of the viewer component. This will be visible if the size of the viewer becomes greater than the maximum image size of 1280x1280. Defaults to #FFFFFF. |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
