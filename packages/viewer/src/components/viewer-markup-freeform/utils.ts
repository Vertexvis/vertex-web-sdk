import { Point } from '@vertexvis/geometry';

export function parsePoints(
  value: string | Point.Point[] | undefined
): Point.Point[] | undefined {
  return typeof value === 'string'
    ? JSON.parse(value).map((values: number[]) =>
        Point.fromJson(JSON.stringify(values))
      )
    : value;
}

export function isVertexViewerFreeformMarkup(
  el: unknown
): el is HTMLVertexViewerMarkupFreeformElement {
  return (
    el instanceof HTMLElement && el.nodeName === 'VERTEX-VIEWER-MARKUP-FREEFORM'
  );
}
