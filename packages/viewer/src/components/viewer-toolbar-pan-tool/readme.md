# viewer-toolbar-pan-tool

The `viewer-toolbar-pan-tool` element is a simple camera tool that renders a button-like element
that will display hovered and selected states.

<!-- Auto Generated Below -->


## Properties

| Property   | Attribute  | Description | Type      | Default     |
| ---------- | ---------- | ----------- | --------- | ----------- |
| `selected` | `selected` |             | `boolean` | `undefined` |


## Dependencies

### Used by

 - [viewer-toolbar-camera-tools](../viewer-toolbar-camera-tools)

### Depends on

- [viewer-toolbar-item](../viewer-toolbar-item)
- [svg-icon](../../icons)

### Graph
```mermaid
graph TD;
  viewer-toolbar-pan-tool --> viewer-toolbar-item
  viewer-toolbar-pan-tool --> svg-icon
  viewer-toolbar-camera-tools --> viewer-toolbar-pan-tool
  style viewer-toolbar-pan-tool fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
