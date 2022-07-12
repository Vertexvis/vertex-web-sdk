# vertex-scene-tree-table-cell



<!-- Auto Generated Below -->


## Properties

| Property                         | Attribute                           | Description                                                                                                                                                                                                                                | Type                                                                                                                                                                                                                                                           | Default     |
| -------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| `expandToggle`                   | `expand-toggle`                     | Indicates whether to display a button for toggling the expanded state of the node associated with this cell.                                                                                                                               | `boolean \| undefined`                                                                                                                                                                                                                                         | `undefined` |
| `interactionsDisabled`           | `interactions-disabled`             | A flag that disables the default interactions of this component. If disabled, you can use the event handlers to be notified when certain operations are performed by the user.                                                             | `boolean`                                                                                                                                                                                                                                                      | `false`     |
| `node`                           | --                                  | The node data that is associated to the row that this cell belongs to. Contains information related to if the node is expanded, visible, etc.                                                                                              | `undefined \| { id?: AsObject \| undefined; depth: number; name: string; visible: boolean; selected: boolean; expanded: boolean; isLeaf: boolean; suppliedId?: AsObject \| undefined; partiallyVisible: boolean; columnsList: string[]; filterHit: boolean; }` | `undefined` |
| `placeholder`                    | `placeholder`                       | The value to display in this cell if the `value` specified is undefined. Defaults to "--".                                                                                                                                                 | `string`                                                                                                                                                                                                                                                       | `'--'`      |
| `recurseParentSelectionDisabled` | `recurse-parent-selection-disabled` | A flag that disables selection of the node's parent if the user selects the row multiple times. When enabled, selection of the same row multiple times will recursively select the next unselected parent until the root node is selected. | `boolean`                                                                                                                                                                                                                                                      | `false`     |
| `selectionValidPredicate`        | --                                  | An optional predicate that will be checked prior to performing a selection. If no predicate is specified, all `pointerup` events will be considered for selection.                                                                         | `((event: PointerEvent) => boolean) \| undefined`                                                                                                                                                                                                              | `undefined` |
| `tree`                           | --                                  | A reference to the scene tree to perform operations for interactions. Such as expansion, visibility and selection.                                                                                                                         | `HTMLVertexSceneTreeElement \| undefined`                                                                                                                                                                                                                      | `undefined` |
| `value`                          | `value`                             | The value to display in this cell.                                                                                                                                                                                                         | `string \| undefined`                                                                                                                                                                                                                                          | `undefined` |
| `visibilityToggle`               | `visibility-toggle`                 | Indicates whether to display a button for toggling the visibility state of the node associated with this cell.                                                                                                                             | `boolean \| undefined`                                                                                                                                                                                                                                         | `undefined` |


## Events

| Event               | Description                                                                                                                                  | Type                                          |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| `expandToggled`     | An event that is emitted when a user requests to expand the node. This is emitted even if interactions are disabled.                         | `CustomEvent<SceneTreeTableCellEventDetails>` |
| `selectionToggled`  | An event that is emitted when a user requests to change the node's selection state. This event is emitted even if interactions are disabled. | `CustomEvent<SceneTreeTableCellEventDetails>` |
| `visibilityToggled` | An event that is emitted when a user requests to change the node's visibility. This event is emitted even if interactions are disabled.      | `CustomEvent<SceneTreeTableCellEventDetails>` |


## CSS Custom Properties

| Name                                    | Description                                                                             |
| --------------------------------------- | --------------------------------------------------------------------------------------- |
| `--scene-tree-cell-background-hover`    | A CSS background of a cell when hovered.                                                |
| `--scene-tree-cell-background-selected` | A CSS background color of a cell when selected.                                         |
| `--scene-tree-cell-padding`             | CSS lengths that specifies the amount of padding between the cell's border and content. |
| `--scene-tree-cell-text-positioning`    | A CSS text alignment value that indicates how text should be positioned.                |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
