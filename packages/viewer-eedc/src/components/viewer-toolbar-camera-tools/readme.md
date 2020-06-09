# viewer-toolbar-camera-tools

The `viewer-toolbar-camera-tools` element provides a set of camera controls that allow for changing
the default interaction type of the `vertex-viewer` component.

<!-- Auto Generated Below -->


## Properties

| Property | Attribute | Description                                                                                                                                                                                 | Type                      | Default     |
| -------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- | ----------- |
| `viewer` | --        | The `vertex-viewer` component that this toolbar will interact with. This property can be injected by the `vertex-viewer` when a `data-viewer="{{viewer element id}}"` attribute is present. | `HTMLVertexViewerElement` | `undefined` |


## Dependencies

### Used by

 - [vertex-viewer-toolbar](../viewer-toolbar)

### Depends on

- [viewer-toolbar-rotate-tool](../viewer-toolbar-rotate-tool)
- [viewer-toolbar-pan-tool](../viewer-toolbar-pan-tool)
- [viewer-toolbar-zoom-tool](../viewer-toolbar-zoom-tool)

### Graph
```mermaid
graph TD;
  viewer-toolbar-camera-tools --> viewer-toolbar-rotate-tool
  viewer-toolbar-camera-tools --> viewer-toolbar-pan-tool
  viewer-toolbar-camera-tools --> viewer-toolbar-zoom-tool
  viewer-toolbar-rotate-tool --> viewer-toolbar-item
  viewer-toolbar-rotate-tool --> svg-icon
  viewer-toolbar-pan-tool --> viewer-toolbar-item
  viewer-toolbar-pan-tool --> svg-icon
  viewer-toolbar-zoom-tool --> viewer-toolbar-item
  viewer-toolbar-zoom-tool --> svg-icon
  vertex-viewer-toolbar --> viewer-toolbar-camera-tools
  style viewer-toolbar-camera-tools fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
