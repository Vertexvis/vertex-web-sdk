# vertex-viewer

<!-- Auto Generated Below -->


## Properties

| Property              | Attribute               | Description                                                                                                                                                                                                                           | Type                                                        | Default     |
| --------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ----------- |
| `cameraControls`      | `camera-controls`       | Enables or disables the default mouse and touch interactions provided by the viewer. Enabled by default.                                                                                                                              | `boolean`                                                   | `true`      |
| `config`              | `config`                | An object or JSON encoded string that defines configuration settings for the viewer.                                                                                                                                                  | `Config \| string`                                          | `undefined` |
| `configEnv`           | `config-env`            | Sets the default environment for the viewer. This setting is used for auto-configuring network hosts.  Use the `config` property for manually setting hosts.                                                                          | `"platdev"`                                                 | `'platdev'` |
| `credentials`         | `credentials`           | A `Credentials` object or JSON encoded string of a `Credentials` object. The viewer must set this property or a combination of `credentialsClientId`, `credentialsToken` and `credentialsApiKey`. This property will take precedence. | `ApiKey \| BearerToken \| Oauth2 \| Unauthorized \| string` | `undefined` |
| `credentialsApiKey`   | `credentials-api-key`   | The api key for a user token credentials flow.                                                                                                                                                                                        | `string`                                                    | `undefined` |
| `credentialsClientId` | `credentials-client-id` | The client ID for an Oauth2 credentials flow. `credentialsToken` must also be set.                                                                                                                                                    | `string`                                                    | `undefined` |
| `credentialsToken`    | `credentials-token`     | The token for an Oauth2 credentials flow. Property is ignored if `credentialsClientId` has not been set.                                                                                                                              | `string`                                                    | `undefined` |
| `scene`               | `scene`                 | A URN of the scene resource to load when the component is mounted in the DOM tree. The specified resource is a URN in the following format:    * `urn:vertexvis:scene:<sceneid>`                                                      | `string`                                                    | `undefined` |


## Events

| Event           | Description                                                                                                                                                                    | Type                           |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------ |
| `frameDrawn`    | Emits an event when a frame has been drawn to the viewer's canvas. The event will include details about the drawn frame, such as the `Scene` information related to the scene. | `CustomEvent<FrameAttributes>` |
| `frameReceived` | Emits an event when a frame has been received by the viewer. The event will include details about the drawn frame, such as the `Scene` information related to the scene.       | `CustomEvent<FrameAttributes>` |
| `tap`           | Emits an event whenever the user taps or clicks a location in the viewer. The event includes the location of the tap or click.                                                 | `CustomEvent<TapEventDetails>` |
| `tokenExpired`  | Emits an event when a provided oauth2 token is about to expire, or is about to expire, causing issues with establishing a websocket connection, or performing API calls.       | `CustomEvent<void>`            |


## Methods

### `getFrameAttributes() => Promise<FrameAttributes.FrameAttributes | undefined>`



#### Returns

Type: `Promise<FrameAttributes>`



### `getInteractionHandlers() => Promise<InteractionHandler[]>`



#### Returns

Type: `Promise<InteractionHandler[]>`



### `load(resource: string) => Promise<void>`

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




## CSS Custom Properties

| Name                  | Description                                                                                                                                                              |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--canvas-background` | The background color of the rendered image. Defaults to #FFFFFF.                                                                                                         |
| `--viewer-background` | The background color of the viewer bounds. This will be visible if the size of the viewer becomes greater than the maximum image size of 1280x1280. Defaults to #FFFFFF. |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
