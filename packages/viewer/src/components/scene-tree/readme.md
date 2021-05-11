# vertex-scene-tree

The `<vertex-scene-tree>` is a component that renders the items that belong to a
scene.

Because scenes can be large, this component uses a list virtualization strategy
to minimize the number of DOM elements created. The component uses [HTML
templates](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_templates_and_slots)
to stamp DOM elements when needed and manages an internal pool of previously
created DOM elements to maximize performance.

## Initializing a Scene Tree

The tree requires that it's connected to an instance of the viewer to perform
certain operations. You can either set the viewer directly through the `viewer`
property, or specify `viewerSelector` with a CSS selector to search for a viewer
instance.

**Example:** Specifying a viewer.

```html
<html>
  <body>
    <vertex-scene-tree viewer-selector="#viewer"></vertex-scene-tree>
    <vertex-viewer id="viewer" src="urn:vertexvis:stream-key:my-key"></vertex-viewer>
  </body>
</html>
```

## Custom Rows

The tree provides a default row component that is responsible for displaying the
content for a row. If you want to customize the appearance or behavior or a row,
you can use the `<vertex-scene-tree-row>` or provide your own HTML.

Custom rows require the use of [binding][#binding] to bind row data to the
template. You can use the `rowData` callback in conjunction with binding to
pass custom data and handlers to your row.

**Example:** Customizing a `<vertex-scene-tree-row>`.

Refer to the [`<vertex-scene-tree-row>`](../scene-tree-row/readme.md) for more
information about this component.

```html
<html>
  <head>
    <style>
      .my-btn {
        color: red;
      }
    </style>
  </head>
  <body>
    <vertex-scene-tree viewer-selector="#viewer">
      <template>
        <vertex-scene-tree-row prop:node="{{row.node}}">
          <button class="my-btn" slot="right-gutter" event:click="{{row.data.handleClick}}">
            {{row.data.buttonLabel}}
          </button>
        </vertex-scene-tree-row>
      </template>
    </vertex-scene-tree>

    <vertex-viewer id="viewer" src="urn:vertexvis:stream-key:my-key"></vertex-viewer>

    <script type="module">
      const tree = document.querySelector('vertex-scene-tree');
      tree.rowData = (row) => {
        return {
          handleClick: () => console.log('clicked row button', row);
          buttonLabel: `Click ${row.index}`
        }
      }
    </script>
  </body>
</html>
```

**Example:** Using your own HTML.

```html
<html>
  <head>
    <style>
      .label {
        color: blue;
      }

      .my-btn {
        color: red;
      }
    </style>
  </head>
  <body>
    <vertex-scene-tree viewer-selector="#viewer">
      <template>
        <div>
          <span>{{row.node.name}}</span>
          <button class="my-btn" slot="right-gutter">Click Me</button>
        </div>
      </template>
    </vertex-scene-tree>

    <vertex-viewer id="viewer" src="urn:vertexvis:stream-key:my-key"></vertex-viewer>
  </body>
</html>
```

## Binding

The tree provides a simple binding syntax to pass data from your `rowData`
callback to your row template. A binding's specified with one of the following
syntaxes:

```html
<!-- Bind text content -->
<div>{{row.data.foo}}</div>

<!-- Bind to a DOM property -->
<input prop:value="{{row.data.foo}}"></div>

<!-- Bind to a DOM attribute -->
<div attr:title="{{row.data.foo}}"></div>

<!-- Bind to a DOM event -->
<button event:click="{{row.data.handler}}"></button>
```

### Attributes vs Properties

The `attr:name` syntax will use `element.setAttribute('name', value)` to assign
a value to a DOM attribute. The `prop:name` syntax uses `element.name = value`
for assignment.

With attribute binding, the browser can only assign strings to attributes.
Because of this, you cannot use an attribute binding to assign a JS object to an
attribute. In these scenarios, using a property binding is preferred. However,
because attribute bindings are string values, they can support string
interpolation. So doing `<div attr:title="Hello {{row.data.name}}"></div>` would
work for an attribute, but not for a property binding.

### Camel Cased Properties and Events

The DOM lowercases property names and events that you assign in your templates
HTML. Bind to a camel cased property or event by separating words with a dash.
The binding syntax will convert dash case to camel case for properties and
events.

```html
<!-- Bind to a DOM property -->
<input prop:my-camel-cased-prop="{{row.data.foo}}"></div>

<!-- Bind to a DOM event -->
<button event:my-camel-cased-event="{{row.data.handler}}"></button>
```

<!-- Auto Generated Below -->


## Properties

| Property            | Attribute            | Description                                                                                                                                                         | Type                                                   | Default      |
| ------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ------------ |
| `config`            | --                   | An object to configure the scene tree.                                                                                                                              | `Config \| undefined`                                  | `undefined`  |
| `configEnv`         | `config-env`         | Sets the default environment for the viewer. This setting is used for auto-configuring network hosts.  Use the `config` property for manually setting hosts.        | `"platdev" \| "platprod" \| "platstaging"`             | `'platprod'` |
| `controller`        | --                   |                                                                                                                                                                     | `SceneTreeController \| undefined`                     | `undefined`  |
| `overScanCount`     | `over-scan-count`    | The number of offscreen rows above and below the viewport to render. Having a higher number reduces the chance of the browser not displaying a row while scrolling. | `number`                                               | `25`         |
| `rowData`           | --                   | A callback that is invoked immediately before a row is about to rendered. This callback can return additional data that can be bound to in a template.              | `((row: Row) => Record<string, unknown>) \| undefined` | `undefined`  |
| `selectionDisabled` | `selection-disabled` | Disables the default selection behavior of the tree. Can be used to implement custom selection behavior via the trees selection methods.                            | `boolean`                                              | `false`      |
| `viewer`            | --                   | An instance of a `<vertex-viewer>` element. Either this property or `viewerSelector` must be set.                                                                   | `HTMLVertexViewerElement \| null \| undefined`         | `undefined`  |
| `viewerSelector`    | `viewer-selector`    | A CSS selector that points to a `<vertex-viewer>` element. Either this property or `viewer` must be set.                                                            | `string \| undefined`                                  | `undefined`  |


## Events

| Event             | Description | Type                                 |
| ----------------- | ----------- | ------------------------------------ |
| `connectionError` |             | `CustomEvent<SceneTreeErrorDetails>` |


## Methods

### `collapseAll() => Promise<void>`

Performs an API call to collapse all nodes in the tree.

#### Returns

Type: `Promise<void>`



### `collapseItem(row: RowArg) => Promise<void>`

Performs an API call that will collapse the node associated to the
specified row or row index.

#### Returns

Type: `Promise<void>`



### `deselectItem(row: RowArg) => Promise<void>`

Performs an API call that will deselect the item associated to the given
row or row index.

#### Returns

Type: `Promise<void>`



### `expandAll() => Promise<void>`

Performs an API call to expand all nodes in the tree.

#### Returns

Type: `Promise<void>`



### `expandItem(row: RowArg) => Promise<void>`

Performs an API call that will expand the node associated to the specified
row or row index.

#### Returns

Type: `Promise<void>`



### `getRowAtClientY(clientY: number) => Promise<Row>`

Returns the row data from the given vertical client position.

#### Returns

Type: `Promise<Row>`



### `getRowAtIndex(index: number) => Promise<Row>`

Returns a row at the given index. If the row data has not been loaded,
returns `undefined`.

#### Returns

Type: `Promise<Row>`



### `getRowForEvent(event: MouseEvent | PointerEvent) => Promise<Row>`

Returns the row data from the given mouse or pointer event. The event
must originate from this component otherwise `undefined` is returned.

#### Returns

Type: `Promise<Row>`



### `hideItem(row: RowArg) => Promise<void>`

Performs an API call that will hide the item associated to the given row
or row index.

#### Returns

Type: `Promise<void>`



### `invalidateRows() => Promise<void>`

Schedules a render of the rows in the scene tree. Useful if any custom
data in your scene tree has changed, and you want to update the row's
contents.

**Note:** This is an asynchronous operation. The update may happen on the
next frame.

#### Returns

Type: `Promise<void>`



### `scrollToIndex(index: number, options?: ScrollToOptions) => Promise<void>`

Scrolls the tree to the given row index.

#### Returns

Type: `Promise<void>`



### `scrollToItem(itemId: string, options?: ScrollToOptions) => Promise<void>`

Scrolls the tree to an item with the given ID. If the node for the item is
not expanded, the tree will expand each of its parent nodes.

#### Returns

Type: `Promise<void>`



### `selectItem(row: RowArg, options?: SelectItemOptions) => Promise<void>`

Performs an API call that will select the item associated to the given row
or row index.

#### Returns

Type: `Promise<void>`



### `showItem(row: RowArg) => Promise<void>`

Performs an API call that will show the item associated to the given row
or row index.

#### Returns

Type: `Promise<void>`



### `toggleExpandItem(row: RowArg) => Promise<void>`

Performs an API call that will either expand or collapse the node
associated to the given row or row index.

#### Returns

Type: `Promise<void>`



### `toggleItemVisibility(row: RowArg) => Promise<void>`

Performs an API call that will either hide or show the item associated to
the given row or row index.

#### Returns

Type: `Promise<void>`




----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
