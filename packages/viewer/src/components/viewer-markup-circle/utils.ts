import { Point, Rectangle } from '@vertexvis/geometry';
import { BoundingBox2dAnchorPosition } from '../viewer-markup/utils';

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

export const transformCircle = (
  bounds: Rectangle.Rectangle,
  start: Point.Point,
  current: Point.Point,
  anchor: BoundingBox2dAnchorPosition
): Rectangle.Rectangle => {
  const delta = Point.create(current.x - start.x, current.y - start.y);
  const { x: left, y: top, width: w, height: h } = bounds;
  const right = left + w;
  const bottom = top + h;
  const topLeft = Point.create(left, top);
  const bottomLeft = Point.create(left, bottom);
  const topRight = Point.create(right, top);
  const bottomRight = Point.create(right, bottom);
  switch (anchor) {
    case 'top-left':
      return Rectangle.fromPoints(bottomRight, current);
    case 'top':
      return Rectangle.fromPoints(bottomRight, Point.create(left, current.y));
    case 'top-right':
      return Rectangle.fromPoints(bottomLeft, current);
    case 'right':
      return Rectangle.fromPoints(bottomLeft, Point.create(current.x, top));
    case 'bottom-right':
      return Rectangle.fromPoints(topLeft, current);
    case 'bottom':
      return Rectangle.fromPoints(topLeft, Point.create(right, current.y));
    case 'bottom-left':
      return Rectangle.fromPoints(topRight, current);
    case 'left':
      return Rectangle.fromPoints(bottomRight, Point.create(current.x, top));
    case 'center':
      return Rectangle.create(
        bounds.x + delta.x,
        bounds.y + delta.y,
        bounds.width,
        bounds.height
      );
  }
};
