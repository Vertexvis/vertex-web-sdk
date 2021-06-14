# vertex-viewer

<!-- Auto Generated Below -->


## Properties

| Property                      | Attribute                       | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Type                                       | Default                    |
| ----------------------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ | -------------------------- |
| `cameraControls`              | `camera-controls`               | Enables or disables the default mouse and touch interactions provided by the viewer. Enabled by default.                                                                                                                                                                                                                                                                                                                                                              | `boolean`                                  | `true`                     |
| `clientId`                    | `client-id`                     | The Client ID associated with your Vertex Application.                                                                                                                                                                                                                                                                                                                                                                                                                | `string \| undefined`                      | `undefined`                |
| `config`                      | `config`                        | An object or JSON encoded string that defines configuration settings for the viewer.                                                                                                                                                                                                                                                                                                                                                                                  | `Config \| string \| undefined`            | `undefined`                |
| `configEnv`                   | `config-env`                    | Sets the default environment for the viewer. This setting is used for auto-configuring network hosts.  Use the `config` property for manually setting hosts.                                                                                                                                                                                                                                                                                                          | `"platdev" \| "platprod" \| "platstaging"` | `'platprod'`               |
| `depthBuffers`                | `depth-buffers`                 | Specifies when a depth buffer is requested from rendering. Possible values are:  * `undefined`: A depth buffer is never requested. * `final`: A depth buffer is only requested on the final frame. * `all`: A depth buffer is requested for every frame.  Depth buffers can increase the amount of data that's sent to a client and can impact rendering performance. Values of `undefined` or `final` should be used when needing the highest rendering performance. | `"all" \| "final" \| undefined`            | `undefined`                |
| `experimentalGhostingOpacity` | `experimental-ghosting-opacity` | Specifies the opacity, between 0 and 100, for an experimental ghosting feature. When the value is non-zero, any scene items that are hidden will be appear translucent.  **Note:** This feature is experimental, and may cause slower frame rates.                                                                                                                                                                                                                    | `number`                                   | `0`                        |
| `frame`                       | --                              | The last frame that was received, which can be used to inspect the scene and camera information.                                                                                                                                                                                                                                                                                                                                                                      | `ReceivedFrame \| undefined`               | `undefined`                |
| `keyboardControls`            | `keyboard-controls`             | Enables or disables the default keyboard shortcut interactions provided by the viewer. Enabled by default, requires `cameraControls` being enabled.                                                                                                                                                                                                                                                                                                                   | `boolean`                                  | `true`                     |
| `rotateAroundTapPoint`        | `rotate-around-tap-point`       | Enables or disables the default rotation interaction being changed to rotate around the mouse down location.                                                                                                                                                                                                                                                                                                                                                          | `boolean`                                  | `false`                    |
| `selectionMaterial`           | `selection-material`            | The default hex color or material to use when selecting items.                                                                                                                                                                                                                                                                                                                                                                                                        | `ColorMaterial \| string`                  | `defaultSelectionMaterial` |
| `sessionId`                   | `session-id`                    | Property used for internals or testing.                                                                                                                                                                                                                                                                                                                                                                                                                               | `string \| undefined`                      | `undefined`                |
| `src`                         | `src`                           | A URN of the scene resource to load when the component is mounted in the DOM tree. The specified resource is a URN in the following format:   * `urn:vertexvis:scene:<sceneid>`                                                                                                                                                                                                                                                                                       | `string \| undefined`                      | `undefined`                |
| `streamAttributes`            | --                              | An object containing the stream attribute values sent to rendering. This value is updated automatically when properties like `depthBuffers` are set. You should not set this value directly, as it may be overridden.                                                                                                                                                                                                                                                 | `ViewerStreamAttributes`                   | `{}`                       |


## Events

| Event              | Description                                                                                                                                                                                                     | Type                                                                     |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `connectionChange` | Emits an event when the connection status changes for the viewer                                                                                                                                                | `CustomEvent<ConnectedStatus \| ConnectingStatus \| DisconnectedStatus>` |
| `dimensionschange` |                                                                                                                                                                                                                 | `CustomEvent<Dimensions>`                                                |
| `doubletap`        | Emits an event whenever the user double taps or clicks a location in the viewer. The event includes the location of the first tap or click.                                                                     | `CustomEvent<TapEventDetails>`                                           |
| `frameDrawn`       | Emits an event when a frame has been drawn to the viewer's canvas. The event will include details about the drawn frame, such as the `Scene` information related to the scene.                                  | `CustomEvent<ReceivedFrame>`                                             |
| `frameReceived`    | Emits an event when a frame has been received by the viewer. The event will include details about the drawn frame, such as the `Scene` information related to the scene.                                        | `CustomEvent<ReceivedFrame>`                                             |
| `longpress`        | Emits an event whenever the user taps or clicks a location in the viewer and the configured amount of time passes without receiving a mouseup or touchend. The event includes the location of the tap or click. | `CustomEvent<TapEventDetails>`                                           |
| `sceneReady`       | Emits an event when the scene is ready to be interacted with.                                                                                                                                                   | `CustomEvent<void>`                                                      |
| `sessionidchange`  | Used for internals or testing.                                                                                                                                                                                  | `CustomEvent<string>`                                                    |
| `tap`              | Emits an event whenever the user taps or clicks a location in the viewer. The event includes the location of the tap or click.                                                                                  | `CustomEvent<TapEventDetails>`                                           |
| `tokenExpired`     | Emits an event when a provided oauth2 token is about to expire, or is about to expire, causing issues with establishing a websocket connection, or performing API calls.                                        | `CustomEvent<void>`                                                      |


## Methods

### `dispatchFrameDrawn(frame: ReceivedFrame) => Promise<void>`



#### Returns

Type: `Promise<void>`



### `getBaseInteractionHandler() => Promise<BaseInteractionHandler | undefined>`



#### Returns

Type: `Promise<BaseInteractionHandler | undefined>`



### `getInteractionHandlers() => Promise<InteractionHandler[]>`



#### Returns

Type: `Promise<InteractionHandler[]>`



### `getJwt() => Promise<string | undefined>`



#### Returns

Type: `Promise<string | undefined>`



### `getStream() => Promise<ViewerStreamApi>`



#### Returns

Type: `Promise<ViewerStreamApi>`



### `isSceneReady() => Promise<boolean>`

Returns `true` indicating that the scene is ready to be interacted with.

#### Returns

Type: `Promise<boolean>`



### `load(urn: string) => Promise<void>`

Loads the given scene into the viewer and return a `Promise` that
resolves when the scene has been loaded. The specified scene is
provided as a URN in the following format:

 * `urn:vertexvis:scene:<sceneid>`

#### Returns

Type: `Promise<void>`



### `registerCommand<R, T>(id: string, factory: CommandFactory<R>, thisArg?: T | undefined) => Promise<Disposable>`

Internal API.

#### Returns

Type: `Promise<Disposable>`



### `registerInteractionHandler(interactionHandler: InteractionHandler) => Promise<Disposable>`

Registers and initializes an interaction handler with the viewer. Returns a
`Disposable` that should be used to deregister the interaction handler.

`InteractionHandler`s are used to build custom mouse and touch interactions
for the viewer. Use `<vertex-viewer camera-controls="false" />` to disable
the default camera controls provided by the viewer.

#### Returns

Type: `Promise<Disposable>`



### `registerTapKeyInteraction(keyInteraction: KeyInteraction<TapEventDetails>) => Promise<void>`

Registers a key interaction to be invoked when a specific set of
keys are pressed during a `tap` event.

`KeyInteraction`s are used to build custom keyboard shortcuts for the
viewer using the current state of they keyboard to determine whether
the `fn` should be invoked. Use `<vertex-viewer keyboard-controls="false" />`
to disable the default keyboard shortcuts provided by the viewer.

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
