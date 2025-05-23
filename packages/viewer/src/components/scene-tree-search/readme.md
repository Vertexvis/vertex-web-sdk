# vertex-scene-tree-search

The `<vertex-scene-tree-search>` represents a text field that can be used to
search for scene tree items. The component contains a search icon, text field
for user input, and a button to clear the search term.

The component emits a `search` event whenever the user changes the value of the
input through user interaction.

When the component is added as a child of a
[`<vertex-scene-tree>`](#../scene-tree/readme.md) the search functionality will
be handled automatically. If added outside the scene tree, the search
functionality will need to be wired programmatically to
`HTMLVertexSceneTreeElement.filterItems()` method.

<!-- Auto Generated Below -->


## Properties

| Property      | Attribute     | Description                                                                                                                                                                                                                                                                                                    | Type                               | Default     |
| ------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- | ----------- |
| `controller`  | --            | The scene tree controller                                                                                                                                                                                                                                                                                      | `SceneTreeController \| undefined` | `undefined` |
| `debounce`    | `debounce`    | Specifies the delay, in milliseconds, to emit `search` events after user input.  If this value is specified, searches will automatically occur after a keystroke has occurred and the debounce threshold has elapsed.  Defaults to `undefined`, and searches only occur on an `Enter` press or a `blur` event. | `number \| undefined`              | `undefined` |
| `disabled`    | `disabled`    | If `true`, disables user interaction of the component.                                                                                                                                                                                                                                                         | `boolean`                          | `false`     |
| `placeholder` | `placeholder` | Placeholder text if `value` is empty.                                                                                                                                                                                                                                                                          | `string \| undefined`              | `undefined` |
| `value`       | `value`       | The current text value of the component. Value is updated on user interaction.                                                                                                                                                                                                                                 | `string`                           | `''`        |


## Events

| Event    | Description                                                                                                                                       | Type                  |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| `search` | An event that is emitted when a user has inputted or cleared the search term. The event may be delayed according to the current `debounce` value. | `CustomEvent<string>` |


## Methods

### `clear() => Promise<void>`

Clears the current search term and clears any debounced filters.

#### Returns

Type: `Promise<void>`



### `setFocus() => Promise<void>`

Gives focus to the component's internal text input.

#### Returns

Type: `Promise<void>`




## Slots

| Slot            | Description                                               |
| --------------- | --------------------------------------------------------- |
| `"clear-icon"`  | A slot that replaces the component's default clear icon.  |
| `"search-icon"` | A slot that replaces the component's default search icon. |


## CSS Custom Properties

| Name                                           | Description                                                                                    |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `--scene-tree-search-clear-button-offset`      | A CSS length that specifies the horizontal offset of the clear button.                         |
| `--scene-tree-search-focused-input-background` | A CSS background value that specifies the background of the internal text input when focused.  |
| `--scene-tree-search-focused-input-outline`    | A CSS outline value that specifies the outline of the internal text input when focused.        |
| `--scene-tree-search-input-background`         | A CSS background that specifies the background color or image of the internal text input.      |
| `--scene-tree-search-input-border`             | A CSS border value that specifies the border of the internal text input.                       |
| `--scene-tree-search-input-border-radius`      | A CSS length that specifies the radius of the internal text input.                             |
| `--scene-tree-search-input-padding`            | A CSS padding value that specifies horizontal and vertical lengths of the internal text input. |
| `--scene-tree-search-search-icon-offset`       | A CSS length that specifies the horizontal offset of the search icon                           |


## Dependencies

### Used by

 - [vertex-scene-tree](../scene-tree)

### Depends on

- [vertex-viewer-spinner](../viewer-spinner)
- [vertex-viewer-icon](../viewer-icon)

### Graph
```mermaid
graph TD;
  vertex-scene-tree-search --> vertex-viewer-spinner
  vertex-scene-tree-search --> vertex-viewer-icon
  vertex-scene-tree --> vertex-scene-tree-search
  style vertex-scene-tree-search fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
