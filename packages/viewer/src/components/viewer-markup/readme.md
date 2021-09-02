# vertex-viewer-markup



<!-- Auto Generated Below -->


## Properties

| Property           | Attribute            | Description                                                                                                                                        | Type                                   | Default     |
| ------------------ | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- | ----------- |
| `arrowTemplateId`  | `arrow-template-id`  | An HTML template that describes the HTML to use for new arrow markup. It's expected that the template contains a `<vertex-viewer-markup-arrow>`.   | `string \| undefined`                  | `undefined` |
| `circleTemplateId` | `circle-template-id` | An HTML template that describes the HTML to use for new circle markup. It's expected that the template contains a `<vertex-viewer-markup-circle>`. | `string \| undefined`                  | `undefined` |
| `disabled`         | `disabled`           | If `true`, disables adding or editing of markup through user interaction.                                                                          | `boolean`                              | `false`     |
| `selectedMarkupId` | `selected-markup-id` | The ID of the markup that is selected.                                                                                                             | `string \| undefined`                  | `undefined` |
| `tool`             | `tool`               | The type of markup to perform.                                                                                                                     | `"arrow" \| "circle"`                  | `'arrow'`   |
| `viewer`           | --                   | The viewer to connect to markup. If nested within a <vertex-viewer>, this property will be populated automatically.                                | `HTMLVertexViewerElement \| undefined` | `undefined` |


## Events

| Event           | Description                                                                                 | Type                                                                                     |
| --------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `markupAdded`   | Dispatched when a new markup is added, either through user interaction or programmatically. | `CustomEvent<HTMLVertexViewerMarkupArrowElement \| HTMLVertexViewerMarkupCircleElement>` |
| `markupRemoved` | Dispatched when a markup is removed, either through user interaction or programmatically.   | `CustomEvent<HTMLVertexViewerMarkupArrowElement \| HTMLVertexViewerMarkupCircleElement>` |


## Methods

### `addMarkup(markup: Markup) => Promise<HTMLVertexViewerMarkupArrowElement | HTMLVertexViewerMarkupCircleElement>`

Adds a new markup as a child to this component. A new markup
component will be created from the template specified by
`arrow-template-id`, `circle-template-id`, or if undefined
a default element will be created.

#### Returns

Type: `Promise<HTMLVertexViewerMarkupArrowElement | HTMLVertexViewerMarkupCircleElement>`



### `getMarkupElements() => Promise<Array<HTMLVertexViewerMarkupArrowElement | HTMLVertexViewerMarkupCircleElement>>`

Returns a list of markup elements that are children of this component.

#### Returns

Type: `Promise<(HTMLVertexViewerMarkupArrowElement | HTMLVertexViewerMarkupCircleElement)[]>`



### `removeMarkup(id: string) => Promise<HTMLVertexViewerMarkupArrowElement | HTMLVertexViewerMarkupCircleElement | undefined>`

Removes a markup with the given ID, and returns the HTML element
associated to the markup. Returns `undefined` if no markup is
found.

#### Returns

Type: `Promise<HTMLVertexViewerMarkupArrowElement | HTMLVertexViewerMarkupCircleElement | undefined>`




## Dependencies

### Depends on

- [vertex-viewer-markup-arrow](../viewer-markup-arrow)
- [vertex-viewer-markup-circle](../viewer-markup-circle)

### Graph
```mermaid
graph TD;
  vertex-viewer-markup --> vertex-viewer-markup-arrow
  vertex-viewer-markup --> vertex-viewer-markup-circle
  style vertex-viewer-markup fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
