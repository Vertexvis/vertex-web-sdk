# vertex-viewer-toolbar-group

A `<vertex-viewer-toolbar-group>` is an element that groups related UI controls
within a `<vertex-viewer-toolbar>`.

## Styling

By default, this component only provides the necessary CSS to layout elements
within a group and does not provide any styling. You can customize borders,
backgrounds, and padding through CSS.

## Usage

```html
<style>
  .group {
    border: 1px solid grey;
    background: lightgrey;
    padding: 0.25rem;
  }
</style>

<vertex-viewer-toolbar>
  <vertex-viewer-toolbar-group class="group">
    <button>Click Me</button>
  </vertex-viewer-toolbar-group>
</vertex-viewer-toolbar>
```

<!-- Auto Generated Below -->


## Dependencies

### Used by

 - [vertex-viewer-default-toolbar](../viewer-default-toolbar)

### Graph
```mermaid
graph TD;
  vertex-viewer-default-toolbar --> vertex-viewer-toolbar-group
  style vertex-viewer-toolbar-group fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
