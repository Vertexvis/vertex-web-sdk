import { Point, Rectangle } from '@vertexvis/geometry';

export type BoundingBox2dAnchorPosition =
  | 'left'
  | 'right'
  | 'top'
  | 'bottom'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'center';

export function getBoundingBox2dAnchorPosition(
  rect: Rectangle.Rectangle,
  position: BoundingBox2dAnchorPosition
): Point.Point {
  switch (position) {
    case 'top-left':
      return Point.create(rect.x, rect.y);
    case 'top':
      return Point.create(rect.x + rect.width / 2, rect.y);
    case 'top-right':
      return Point.create(rect.x + rect.width, rect.y);
    case 'right':
      return Point.create(rect.x + rect.width, rect.y + rect.height / 2);
    case 'bottom-right':
      return Point.create(rect.x + rect.width, rect.y + rect.height);
    case 'bottom':
      return Point.create(rect.x + rect.width / 2, rect.y + rect.height);
    case 'bottom-left':
      return Point.create(rect.x, rect.y + rect.height);
    case 'left':
      return Point.create(rect.x, rect.y + rect.height / 2);
    case 'center':
      return Rectangle.center(rect);
  }
}
