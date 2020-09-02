# vertex-viewer

<!-- Auto Generated Below -->


## Properties

| Property         | Attribute         | Description                                                                                                                                                                      | Type                      | Default      |
| ---------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- | ------------ |
| `cameraControls` | `camera-controls` | Enables or disables the default mouse and touch interactions provided by the viewer. Enabled by default.                                                                         | `boolean`                 | `true`       |
| `config`         | `config`          | An object or JSON encoded string that defines configuration settings for the viewer.                                                                                             | `Config \| string`        | `undefined`  |
| `configEnv`      | `config-env`      | Sets the default environment for the viewer. This setting is used for auto-configuring network hosts.  Use the `config` property for manually setting hosts.                     | `"platdev" \| "platprod"` | `'platprod'` |
| `src`            | `src`             | A URN of the scene resource to load when the component is mounted in the DOM tree. The specified resource is a URN in the following format:    * `urn:vertexvis:scene:<sceneid>` | `string`                  | `undefined`  |


## Events

| Event           | Description                                                                                                                                                                    | Type                           |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------ |
| `frameDrawn`    | Emits an event when a frame has been drawn to the viewer's canvas. The event will include details about the drawn frame, such as the `Scene` information related to the scene. | `CustomEvent<Frame>`           |
| `frameReceived` | Emits an event when a frame has been received by the viewer. The event will include details about the drawn frame, such as the `Scene` information related to the scene.       | `CustomEvent<Frame>`           |
| `tap`           | Emits an event whenever the user taps or clicks a location in the viewer. The event includes the location of the tap or click.                                                 | `CustomEvent<TapEventDetails>` |
| `tokenExpired`  | Emits an event when a provided oauth2 token is about to expire, or is about to expire, causing issues with establishing a websocket connection, or performing API calls.       | `CustomEvent<void>`            |


## Methods

### `getFrame() => Promise<Frame.Frame | undefined>`



#### Returns

Type: `Promise<Frame>`



### `getInteractionHandlers() => Promise<InteractionHandler[]>`



#### Returns

Type: `Promise<InteractionHandler[]>`



### `load(urn: string) => Promise<void>`

Loads the given scene into the viewer and return a `Promise` that
resolves when the scene has been loaded. The specified scene is
provided as a URN in the following format:

  * `urn:vertexvis:scene:<sceneid>`

#### Returns

Type: `Promise<void>`



### `registerCommand<R, T>(id: string, factory: CommandFactory<R>, thisArg?: T) => Promise<Disposable>`

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



### `scene() => Promise<Scene>`



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
