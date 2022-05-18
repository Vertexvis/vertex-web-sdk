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
HTML. Bind to a camel-cased property or event by separating words with a dash.
The binding syntax will convert dash case to camel case for properties and
events.

```html
<!-- Bind to a DOM property -->
<input prop:my-camel-cased-prop="{{row.data.foo}}"></div>

<!-- Bind to a DOM event -->
<button event:my-camel-cased-event="{{row.data.handler}}"></button>
```

## Headers and Footers

The component supports slots for specifying a header and footer. We provide a
[`<vertex-scene-tree-toolbar>`](../scene-tree-toolbar/readme.md) helper
component to layout content in the header and footer.

**Note:** By default, the component renders a search field in the header. If you
replace the header and want search behavior, your header slot should include a
[`<vertex-scene-tree-search>`](../scene-tree-search/readme.md).

**Example:** Supplying a header and footer.

```html
<html>
  <body>
    <vertex-scene-tree viewer-selector="#viewer">
      <vertex-scene-tree-toolbar slot="header">
        <vertex-scene-tree-search></vertex-scene-tree-search>

        <vertex-scene-tree-toolbar-group slot="after">
          <button>A</button>
          <button>B</button>
        </vertex-scene-tree-toolbar-group>
      </vertex-scene-tree-toolbar>

      <vertex-scene-tree-toolbar slot="footer">
        <button slot="before">A</button>
        <div>Footer Text</div>
        <button slot="after">A</button>
      </vertex-scene-tree-toolbar>
    </vertex-scene-tree>
    <vertex-viewer id="viewer" src="urn:vertexvis:stream-key:my-key"></vertex-viewer>
  </body>
</html>
```

**Example:** Stacking headers and footers.

Pass multiple elements with a slot name of `header` or `footer` to vertically
stack toolbars.

```html
<html>
  <body>
    <vertex-scene-tree viewer-selector="#viewer">
      <!-- Main header toolbar -->
      <vertex-scene-tree-toolbar slot="header">
        <vertex-scene-tree-search></vertex-scene-tree-search>
      </vertex-scene-tree-toolbar>
      <!-- Secondary header toolbar -->
      <vertex-scene-tree-toolbar slot="header">
        <button>A</button>
        <button>B</button>
      </vertex-scene-tree-toolbar>

      <!-- Main footer toolbar -->
      <vertex-scene-tree-toolbar slot="footer">
        <button>A</button>
        <button>B</button>
      </vertex-scene-tree-toolbar>
      <!-- Secondary footer toolbar -->
      <vertex-scene-tree-toolbar slot="footer">
        <button slot="before">A</button>
        <div>Footer Text</div>
        <button slot="after">A</button>
      </vertex-scene-tree-toolbar>
    </vertex-scene-tree>
    <vertex-viewer id="viewer" src="urn:vertexvis:stream-key:my-key"></vertex-viewer>
  </body>
</html>
```

<!-- Auto Generated Below -->


## Properties

| Property                   | Attribute                     | Description                                                                                                                                                         | Type                                                   | Default      |
| -------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ------------ |
| `config`                   | --                            | An object to configure the scene tree.                                                                                                                              | `Config \| undefined`                                  | `undefined`  |
| `configEnv`                | `config-env`                  | Sets the default environment for the viewer. This setting is used for auto-configuring network hosts.  Use the `config` property for manually setting hosts.        | `"platdev" \| "platprod" \| "platstaging"`             | `'platprod'` |
| `controller`               | --                            |                                                                                                                                                                     | `SceneTreeController \| undefined`                     | `undefined`  |
| `metadataKeys`             | --                            | A list of part metadata keys that will be made available to each row. This metadata can be used for data binding inside the scene tree's template.                  | `string[]`                                             | `[]`         |
| `metadataSearchExactMatch` | `metadata-search-exact-match` | Indicates whether the metadata search should use an exact match.                                                                                                    | `boolean`                                              | `false`      |
| `metadataSearchKeys`       | --                            | A list of the metadata keys that a scene tree search should be performed on.                                                                                        | `string[]`                                             | `[]`         |
| `overScanCount`            | `over-scan-count`             | The number of offscreen rows above and below the viewport to render. Having a higher number reduces the chance of the browser not displaying a row while scrolling. | `number`                                               | `25`         |
| `rowData`                  | --                            | A callback that is invoked immediately before a row is about to rendered. This callback can return additional data that can be bound to in a template.              | `((row: Row) => Record<string, unknown>) \| undefined` | `undefined`  |
| `viewer`                   | --                            | An instance of a `<vertex-viewer>` element. Either this property or `viewerSelector` must be set.                                                                   | `HTMLVertexViewerElement \| null \| undefined`         | `undefined`  |
| `viewerSelector`           | `viewer-selector`             | A CSS selector that points to a `<vertex-viewer>` element. Either this property or `viewer` must be set.                                                            | `string \| undefined`                                  | `undefined`  |


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



### `fetchMetadataKeys() => Promise<MetadataKey[]>`

Fetches the metadata keys that are available to the scene tree. Metadata
keys can be assigned to the scene tree using the `metadataKeys` property.
The scene tree will fetch this metadata and make these values available
for data binding.

#### Returns

Type: `Promise<string[]>`

A promise that resolves with the names of available keys.

### `filterItems(term: string, options?: FilterTreeOptions) => Promise<void>`

Performs an async request that will filter the displayed items in the tree
that match the given term and options.

#### Returns

Type: `Promise<void>`

A promise that completes when the request has completed. Note,
items are displayed asynchronously. So the displayed items may not reflect
the result of this filter when the promise completes.

### `getRowAtClientY(clientY: number) => Promise<Row>`

Returns the row data from the given vertical client position.

#### Returns

Type: `Promise<Row>`

A row or `undefined` if the row hasn't been loaded.

### `getRowAtIndex(index: number) => Promise<Row>`

Returns a row at the given index. If the row data has not been loaded,
returns `undefined`.

#### Returns

Type: `Promise<Row>`

A row, or `undefined` if the row hasn't been loaded.

### `getRowForEvent(event: MouseEvent | PointerEvent) => Promise<Row>`

Returns the row data from the given mouse or pointer event. The event must
originate from a `vertex-scene-tree-table-cell` contained by this element,
otherwise `undefined` is returned.

#### Returns

Type: `Promise<Row>`

A row, or `undefined` if the row hasn't been loaded.

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

A promise that resolves when the operation is finished.

### `selectFilteredItems(term: string) => Promise<void>`

Performs an async request that will select the filtered items in the tree
that match the given term.

#### Returns

Type: `Promise<void>`

A promise that completes when the request has completed.

### `selectItem(row: RowArg, { recurseParent, ...options }?: SelectItemOptions) => Promise<void>`

Performs an API call that will select the item associated to the given row
or row index.

This method supports a `recurseParent` option that allows for recursively
selecting the next unselected parent node. This behavior is considered
stateful. Each call to `selectItem` will track the ancestry of the passed
in `rowArg`. If calling `selectItem` with a row not belonging to the
ancestry of a previous selection, then this method will perform a standard
selection.

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




## Slots

| Slot       | Description                                                                                                                                                                           |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"footer"` | A slot that places content below the rows in the tree. Elements can be stacked by assigning multiple elements to this slot.                                                           |
| `"header"` | A slot that places content above the rows in the tree. By default, a search toolbar will be placed in this slot. Elements can be stacked by assigning multiple elements to this slot. |


## CSS Custom Properties

| Name                             | Description                                                               |
| -------------------------------- | ------------------------------------------------------------------------- |
| `--scene-tree-toolbar-separator` | A CSS border value that specifies the border between scene tree toolbars. |


## Dependencies

### Depends on

- [vertex-scene-tree-toolbar](../scene-tree-toolbar)
- [vertex-scene-tree-search](../scene-tree-search)
- [vertex-scene-tree-table-layout](../scene-tree-table-layout)

### Graph
```mermaid
graph TD;
  vertex-scene-tree --> vertex-scene-tree-toolbar
  vertex-scene-tree --> vertex-scene-tree-search
  vertex-scene-tree --> vertex-scene-tree-table-layout
  vertex-scene-tree-search --> vertex-viewer-icon
  style vertex-scene-tree fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
