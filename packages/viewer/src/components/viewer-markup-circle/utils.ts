import { Rectangle } from '@vertexvis/geometry';

export function isVertexViewerCircleMarkup(
  el: unknown
): el is HTMLVertexViewerMarkupCircleElement {
  return (
    el instanceof HTMLElement && el.nodeName === 'VERTEX-VIEWER-MARKUP-CIRCLE'
  );
}

export function parseBounds(
  value: string | Rectangle.Rectangle | undefined
): Rectangle.Rectangle | undefined {
  return typeof value === 'string' ? Rectangle.fromJson(value) : value;
}
