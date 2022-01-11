import { Point } from '@vertexvis/geometry';

import { Cursor } from './cursors';

export function getMouseClientPosition(
  event: MouseEvent,
  offsets?: DOMRect
): Point.Point {
  const pt = Point.create(event.clientX, event.clientY);
  if (offsets == null) {
    return pt;
  } else {
    return Point.subtract(pt, Point.create(offsets.left, offsets.top));
  }
}

/**
 * Returns a CSS transform that will center an element at the given position.
 */
export function cssTransformCenterAt(position: Point.Point): string {
  const { x, y } = position;
  return `translate(-50%, -50%) translate(${x}px, ${y}px)`;
}

/**
 * Returns a CSS value for a cursor.
 */
export function cssCursor(cursor: Cursor): string {
  if (typeof cursor === 'string') {
    return cursor;
  } else {
    const parts = [
      `url("${cursor.url}")`,
      cursor.offsetX ?? 0,
      cursor.offsetY ?? 0,
      ', auto',
    ];
    return parts.join(' ');
  }
}
