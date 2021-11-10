# vertex-scene-tree-table-cell



<!-- Auto Generated Below -->


## Properties

| Property           | Attribute           | Description | Type                                                                                                                                                                                                                                       | Default     |
| ------------------ | ------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- |
| `expandToggle`     | `expand-toggle`     |             | `boolean \| undefined`                                                                                                                                                                                                                     | `undefined` |
| `hoveredNodeId`    | `hovered-node-id`   |             | `string \| undefined`                                                                                                                                                                                                                      | `undefined` |
| `node`             | --                  |             | `undefined \| { id?: AsObject \| undefined; depth: number; name: string; visible: boolean; selected: boolean; expanded: boolean; isLeaf: boolean; suppliedId?: AsObject \| undefined; partiallyVisible: boolean; columnsList: string[]; }` | `undefined` |
| `tree`             | --                  |             | `HTMLVertexSceneTreeElement \| null \| undefined`                                                                                                                                                                                          | `undefined` |
| `value`            | `value`             |             | `string \| undefined`                                                                                                                                                                                                                      | `undefined` |
| `visibilityToggle` | `visibility-toggle` |             | `boolean \| undefined`                                                                                                                                                                                                                     | `undefined` |


## Events

| Event               | Description | Type                                                                                                                                                                                                                                                    |
| ------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `expansionToggled`  |             | `CustomEvent<{ id?: AsObject \| undefined; depth: number; name: string; visible: boolean; selected: boolean; expanded: boolean; isLeaf: boolean; suppliedId?: AsObject \| undefined; partiallyVisible: boolean; columnsList: string[]; }>`              |
| `hovered`           |             | `CustomEvent<undefined \| { id?: AsObject \| undefined; depth: number; name: string; visible: boolean; selected: boolean; expanded: boolean; isLeaf: boolean; suppliedId?: AsObject \| undefined; partiallyVisible: boolean; columnsList: string[]; }>` |
| `selectionToggled`  |             | `CustomEvent<{ id?: AsObject \| undefined; depth: number; name: string; visible: boolean; selected: boolean; expanded: boolean; isLeaf: boolean; suppliedId?: AsObject \| undefined; partiallyVisible: boolean; columnsList: string[]; }>`              |
| `visibilityToggled` |             | `CustomEvent<{ id?: AsObject \| undefined; depth: number; name: string; visible: boolean; selected: boolean; expanded: boolean; isLeaf: boolean; suppliedId?: AsObject \| undefined; partiallyVisible: boolean; columnsList: string[]; }>`              |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
