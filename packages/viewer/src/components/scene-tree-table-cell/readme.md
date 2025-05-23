# vertex-scene-tree-table-cell



<!-- Auto Generated Below -->


## Properties

| Property            | Attribute           | Description                                                                                                                                                                                                                                                                               | Type                                                                                                                                                                                                                                                                                               | Default     |
| ------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| `alwaysShowIcons`   | `always-show-icons` | Whether to always show the requested icons in the cell. If false, the icons will only appear when hovering over the cell.                                                                                                                                                                 | `boolean`                                                                                                                                                                                                                                                                                          | `false`     |
| `expandToggle`      | `expand-toggle`     | Indicates whether to display a button for toggling the expanded state of the node associated with this cell.                                                                                                                                                                              | `boolean \| undefined`                                                                                                                                                                                                                                                                             | `undefined` |
| `expansionHandler`  | --                  | An optional handler that will override this cell's default expansion behavior. The registered handler will receive the `pointerup` event, the node data for the row this cell is associated with, and a reference to the parent `<vertex-scene-tree>` element for performing operations.  | `((event: PointerEvent, node: AsObject, tree: HTMLVertexSceneTreeElement) => void) \| undefined`                                                                                                                                                                                                   | `undefined` |
| `isolateButton`     | `isolate-button`    | Indicates whether to display a button for isolating (show only + fly to) the node associated with this cell.                                                                                                                                                                              | `boolean \| undefined`                                                                                                                                                                                                                                                                             | `undefined` |
| `isolateHandler`    | --                  | An optional handler that will override this cell's default isolate behavior. The registered handler will receive the `pointerup` event, the node data for the row this cell is associated with, and a reference to the parent `<vertex-scene-tree>` element for performing operations.    | `((event: PointerEvent, node: AsObject, tree: HTMLVertexSceneTreeElement) => void) \| undefined`                                                                                                                                                                                                   | `undefined` |
| `node`              | --                  | The node data that is associated to the row that this cell belongs to. Contains information related to if the node is expanded, visible, etc.                                                                                                                                             | `undefined \| { id?: AsObject \| undefined; depth: number; name: string; visible: boolean; selected: boolean; expanded: boolean; isLeaf: boolean; suppliedId?: AsObject \| undefined; partiallyVisible: boolean; columnsList: string[]; filterHit: boolean; phantom: boolean; endItem: boolean; }` | `undefined` |
| `placeholder`       | `placeholder`       | The value to display in this cell if the `value` specified is undefined. Defaults to "--".                                                                                                                                                                                                | `string`                                                                                                                                                                                                                                                                                           | `'--'`      |
| `selectionHandler`  | --                  | An optional handler that will override this cell's default selection behavior. The registered handler will receive the `pointerup` event, the node data for the row this cell is associated with, and a reference to the parent `<vertex-scene-tree>` element for performing operations.  | `((event: PointerEvent, node: AsObject, tree: HTMLVertexSceneTreeElement) => void) \| undefined`                                                                                                                                                                                                   | `undefined` |
| `tree`              | --                  | A reference to the scene tree to perform operations for interactions. Such as expansion, visibility and selection.                                                                                                                                                                        | `HTMLVertexSceneTreeElement \| undefined`                                                                                                                                                                                                                                                          | `undefined` |
| `value`             | `value`             | The value to display in this cell.                                                                                                                                                                                                                                                        | `string \| undefined`                                                                                                                                                                                                                                                                              | `undefined` |
| `visibilityHandler` | --                  | An optional handler that will override this cell's default visibility behavior. The registered handler will receive the `pointerup` event, the node data for the row this cell is associated with, and a reference to the parent `<vertex-scene-tree>` element for performing operations. | `((event: PointerEvent, node: AsObject, tree: HTMLVertexSceneTreeElement) => void) \| undefined`                                                                                                                                                                                                   | `undefined` |
| `visibilityToggle`  | `visibility-toggle` | Indicates whether to display a button for toggling the visibility state of the node associated with this cell.                                                                                                                                                                            | `boolean \| undefined`                                                                                                                                                                                                                                                                             | `undefined` |


## Events

| Event               | Description                                                                                                                                  | Type                                          |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| `cellLoaded`        | Used for internals or testing.                                                                                                               | `CustomEvent<void>`                           |
| `expandToggled`     | An event that is emitted when a user requests to expand the node. This is emitted even if interactions are disabled.                         | `CustomEvent<SceneTreeTableCellEventDetails>` |
| `isolatePressed`    | An event that is emitted when a user requests to isolate the node. This event is emitted even if interactions are disabled.                  | `CustomEvent<SceneTreeTableCellEventDetails>` |
| `selectionToggled`  | An event that is emitted when a user requests to change the node's selection state. This event is emitted even if interactions are disabled. | `CustomEvent<SceneTreeTableCellEventDetails>` |
| `visibilityToggled` | An event that is emitted when a user requests to change the node's visibility. This event is emitted even if interactions are disabled.      | `CustomEvent<SceneTreeTableCellEventDetails>` |


## CSS Custom Properties

| Name                                    | Description                                                                             |
| --------------------------------------- | --------------------------------------------------------------------------------------- |
| `--scene-tree-cell-background-hover`    | A CSS background of a cell when hovered.                                                |
| `--scene-tree-cell-background-selected` | A CSS background color of a cell when selected.                                         |
| `--scene-tree-cell-padding`             | CSS lengths that specifies the amount of padding between the cell's border and content. |
| `--scene-tree-cell-text-positioning`    | A CSS text alignment value that indicates how text should be positioned.                |


## Dependencies

### Depends on

- [vertex-viewer-icon](../viewer-icon)

### Graph
```mermaid
graph TD;
  vertex-scene-tree-table-cell --> vertex-viewer-icon
  style vertex-scene-tree-table-cell fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
