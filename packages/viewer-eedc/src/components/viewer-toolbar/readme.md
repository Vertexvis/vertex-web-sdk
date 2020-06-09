# vertex-viewer-toolbar

The `vertex-viewer-toolbar` element provides a wrapper around the children provided to it that
will position the children at the bottom of the `vertex-viewer` element. By default, this element will
render in the `viewer-toolbar-camera-tools` element, which contains a set of default interaction tools.

## Style Overrides

| Variable Name                             | Description                                                                         | Default |
| ----------------------------------------- | ----------------------------------------------------------------------------------- | ------- |
| `--vertex-viewer-toolbar-width`           | The width that the toolbar should take in the containing element                    | `100%`  |
| `--vertex-viewer-toolbar-left-position`   | The horizontal position of the toolbar from the left side of the containing element | `0`     |
| `--vertex-viewer-toolbar-bottom-position` | The vertical position of the toolbar from the bottom of the containing component    | `16px`  |

<!-- Auto Generated Below -->


## Properties

| Property | Attribute | Description                                                                                                                                                                                 | Type                      | Default     |
| -------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- | ----------- |
| `viewer` | --        | The `vertex-viewer` component that this toolbar will interact with. This property can be injected by the `vertex-viewer` when a `data-viewer="{{viewer element id}}"` attribute is present. | `HTMLVertexViewerElement` | `undefined` |


## Dependencies

### Depends on

- [viewer-toolbar-group](../viewer-toolbar-group)
- [viewer-toolbar-camera-tools](../viewer-toolbar-camera-tools)
- [viewer-toolbar-fit-all-tool](../viewer-toolbar-fit-all-tool)

### Graph
```mermaid
graph TD;
  vertex-viewer-toolbar --> viewer-toolbar-group
  vertex-viewer-toolbar --> viewer-toolbar-camera-tools
  vertex-viewer-toolbar --> viewer-toolbar-fit-all-tool
  viewer-toolbar-camera-tools --> viewer-toolbar-rotate-tool
  viewer-toolbar-camera-tools --> viewer-toolbar-pan-tool
  viewer-toolbar-camera-tools --> viewer-toolbar-zoom-tool
  viewer-toolbar-rotate-tool --> viewer-toolbar-item
  viewer-toolbar-rotate-tool --> svg-icon
  viewer-toolbar-pan-tool --> viewer-toolbar-item
  viewer-toolbar-pan-tool --> svg-icon
  viewer-toolbar-zoom-tool --> viewer-toolbar-item
  viewer-toolbar-zoom-tool --> svg-icon
  viewer-toolbar-fit-all-tool --> viewer-toolbar-item
  viewer-toolbar-fit-all-tool --> svg-icon
  style vertex-viewer-toolbar fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
