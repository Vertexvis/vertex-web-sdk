# vertex-scene-tree-row

The `<vertex-scene-tree-row>` component renders a row within a
`<vertex-scene-tree>` component. The row displays the node's name, expansion,
visibility, and selection states. It also handles interactions to change the
state of the node through user interactions.

## Customization

You can customize the appearance of the row through [slots](#slots) and [CSS
Custom Properties](#css-custom-properties). The row defines slots to provide
your own HTML to the left and right gutters of the row, as well as the label.

The scene tree also provides a simple bindings syntax that can be used to bind
to data that is returned from your `rowData` callback. See our
[binding](../scene-tree/readme.md#binding) documentation for more information
about how data binding.

**Example:** Customizing a row with slots.

```html
<html>
  <head>
    <style>
      .tree {
        --scene-tree-row-background: white;
        --scene-tree-row-background-hover: light-grey;
        --scene-tree-row-background-selected: linear-gradient(0deg, rgba(34,193,195,1) 0%, rgba(253,187,45,1) 100%);
      }

      .indicator {
        width: 8px;
        height: 8px;
        border-radius: 4px;
      }
    </style>
  </head>
  <body>
    <vertex-scene-tree class="tree">
      <template>
        <vertex-scene-tree-row prop:node={{row.node}}>
          <div slot="left-gutter" class="indicator" attr:style="background-color: {{row.data.color}};"></div>
        </vertex-scene-tree-row>
      </template>
    </vertex-scene-tree>

    <script type="module">
      const tree = document.querySelector('vertex-scene-tree');

      // This callback is invoked for each row that is presented in the tree.
      // It allows you to define custom data that can be passed to the row
      // through bindings. In this case, we specify a color that can be bound
      // through {{row.data.color}}.
      tree.rowData = (row) => {
        const color = `#${Math.round(Math.random() * (255 * 255 * 255))
          .toString(16)
          .padStart(6, '0')}`;
        return { color };
      }
    </script>
  </body>
</html>
```

## CSS Selectors

The row will set certain CSS selectors depending on the state of the node.
Selectors can be used to customize the styling of your slots depending on which
selectors are set. The following is a list of selectors that will be set:

* `selected`: Specifies that the row's node has been selected.
* `expanded`: Specifies that the row's node has been expanded.
* `hidden`: Specifies that the row's node has been hidden.

**Example:** Using selectors to customize appearance.

```html
<html>
  <head>
    <style>
      .row.selected .label {
        text-decoration: underline;
      }
    </style>
  </head>
  <body>
    <vertex-scene-tree>
      <template>
        <vertex-scene-tree-row class="row" prop:node={{row.node}}>
          <div slot="label" class="label">{{row.node.name}}</div>
        </vertex-scene-tree-row>
      </template>
    </vertex-scene-tree>

    <script type="module">
      const tree = document.querySelector('vertex-scene-tree');
      tree.rowData = (row) => {
        const color = `#${Math.round(Math.random() * (255 * 255 * 255))
          .toString(16)
          .padStart(6, '0')}`;
        return { color };
      }
    </script>
  </body>
</html>
```

## Event Handlers

The row dispatches events when a user expands, selects or changes the node's
visibility through user interactions. You can bind to these events to perform
custom behavior through bindings and the `rowData` callback.

**Example:** Using event handlers.

```html
<html>
  <body>
    <vertex-scene-tree>
      <template>
        <vertex-scene-tree-row class="row" event:expandToggled={{row.data.handleExpand}}>
        </vertex-scene-tree-row>
      </template>
    </vertex-scene-tree>

    <script type="module">
      const tree = document.querySelector('vertex-scene-tree');
      tree.rowData = (row) => {
        return {
          handleExpand: () => console.log('node expanded for row', row);
        }
      }
    </script>
  </body>
</html>
```

<!-- Auto Generated Below -->


## Properties

| Property               | Attribute               | Description                                                                                                                                                                    | Type                                                                                                                                                                                     | Default     |
| ---------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| `interactionsDisabled` | `interactions-disabled` | A flag that disables the default interactions of this component. If disabled, you can use the event handlers to be notified when certain operations are performed by the user. | `boolean`                                                                                                                                                                                | `false`     |
| `node`                 | --                      | The node data that is associated to the row. Contains information related to if the node is expanded, visible, etc.                                                            | `undefined \| { id?: AsObject \| undefined; depth: number; name: string; visible: boolean; selected: boolean; expanded: boolean; isLeaf: boolean; suppliedId?: AsObject \| undefined; }` | `undefined` |
| `tree`                 | --                      | A reference to the scene tree to perform operations for interactions. Such as expansion, visibility and selection.                                                             | `HTMLVertexSceneTreeElement \| undefined`                                                                                                                                                | `undefined` |


## Events

| Event               | Description                                                                                                                                  | Type                |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| `expandToggled`     | An event that is emitted when a user requests to expand the node. This is emitted even if interactions are disabled.                         | `CustomEvent<void>` |
| `selectionToggled`  | An event that is emitted when a user requests to change the node's selection state. This event is emitted even if interactions are disabled. | `CustomEvent<void>` |
| `visibilityToggled` | An event that is emitted when a user requests to change the node's visibility. This event is emitted even if interactions are disabled.      | `CustomEvent<void>` |


## Slots

| Slot                                                                                                                                                                 | Description |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| `"label An HTML element to replace the default label provided by the component. Can be used to customize the content between the expansion and visibility buttons."` |             |
| `"left-gutter An HTML element that is placed at the left side of the row, before the indentation and expansion button."`                                             |             |
| `"right-gutter An HTML element that is placed at the right side of the row, after the visibility button."`                                                           |             |


## CSS Custom Properties

| Name                                   | Description                                                                            |
| -------------------------------------- | -------------------------------------------------------------------------------------- |
| `--scene-tree-row-background`          | A CSS background of a row.                                                             |
| `--scene-tree-row-background-hover`    | A CSS background of a row when hovered.                                                |
| `--scene-tree-row-background-selected` | A CSS background color of a row when selected.                                         |
| `--scene-tree-row-indentation-size`    | A CSS length that specifies the size of indenting a node's child from its parent.      |
| `--scene-tree-row-padding`             | CSS lengths that specifies the amount of padding between the row's border and content. |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
