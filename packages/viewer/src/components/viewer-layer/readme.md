# vertex-viewer-layer

The `<vertex-viewer-layer>` component is a container that stretches to fill the
viewport of a `<vertex-viewer>`.

**Example:** Positioning an element at the bottom of a viewer.

```html
<html>
  <head>
    <style>
      .toolbar {
        position: absolute;
        bottom: 20px;
        left: 20px;
      }
    </style>
  </head>
  <body>
    <vertex-viewer id="viewer" src="urn:vertex:stream-key:my-key">
      <vertex-viewer-layer>
        <div class="toolbar">
          <button>Click Me</button>
        </div>
      </vertex-viewer-layer>
    </vertex-viewer>
  </body>
</html>
```

<!-- Auto Generated Below -->


## Properties

| Property     | Attribute     | Description                                                                                          | Type      | Default |
| ------------ | ------------- | ---------------------------------------------------------------------------------------------------- | --------- | ------- |
| `stretchOff` | `stretch-off` | Indicates if the layer should stretch to fill the size of its container's nearest positioned parent. | `boolean` | `false` |


## Dependencies

### Used by

 - [vertex-viewer-box-query-tool](../viewer-box-query-tool)
 - [vertex-viewer-toolbar](../viewer-toolbar)

### Graph
```mermaid
graph TD;
  vertex-viewer-box-query-tool --> vertex-viewer-layer
  vertex-viewer-toolbar --> vertex-viewer-layer
  style vertex-viewer-layer fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
