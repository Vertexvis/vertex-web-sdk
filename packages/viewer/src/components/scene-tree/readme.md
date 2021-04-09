# vertex-scene-tree



<!-- Auto Generated Below -->


## Properties

| Property                | Attribute                 | Description                                                                                                                                                  | Type                                       | Default      |
| ----------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------ | ------------ |
| `approximateItemHeight` | `approximate-item-height` |                                                                                                                                                              | `number`                                   | `20`         |
| `config`                | --                        |                                                                                                                                                              | `Config \| undefined`                      | `undefined`  |
| `configEnv`             | `config-env`              | Sets the default environment for the viewer. This setting is used for auto-configuring network hosts.  Use the `config` property for manually setting hosts. | `"platdev" \| "platprod" \| "platstaging"` | `'platprod'` |
| `controller`            | --                        |                                                                                                                                                              | `SceneTreeController \| undefined`         | `undefined`  |
| `jwt`                   | `jwt`                     |                                                                                                                                                              | `string \| undefined`                      | `undefined`  |
| `overScanCount`         | `over-scan-count`         |                                                                                                                                                              | `number`                                   | `10`         |
| `rowData`               | --                        |                                                                                                                                                              | `(row: Row) => object`                     | `() => ({})` |
| `viewer`                | --                        |                                                                                                                                                              | `HTMLVertexViewerElement \| undefined`     | `undefined`  |
| `viewerSelector`        | `viewer-selector`         |                                                                                                                                                              | `string \| undefined`                      | `undefined`  |


## Methods

### `collapseAll() => Promise<void>`



#### Returns

Type: `Promise<void>`



### `expandAll() => Promise<void>`



#### Returns

Type: `Promise<void>`



### `invalidateRows() => Promise<void>`



#### Returns

Type: `Promise<void>`



### `scrollToIndex(index: number) => Promise<void>`



#### Returns

Type: `Promise<void>`




## CSS Custom Properties

| Name                       | Description                                |
| -------------------------- | ------------------------------------------ |
| `--scene-tree-row-height`  | The height of each row in the scene tree.  |
| `--scene-tree-row-padding` | The padding of each row in the scene tree. |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
