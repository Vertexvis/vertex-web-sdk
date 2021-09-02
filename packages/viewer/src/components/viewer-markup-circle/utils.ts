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

export const createCircle = (
  initialPoint: Point.Point,
  currentPoint: Point.Point,
  maintainAspectRatio: boolean
): Rectangle.Rectangle => {
  const bounds = Rectangle.fromPoints(initialPoint, currentPoint);
  if (maintainAspectRatio) {
    const fitBoundsSize = Math.max(bounds.width, bounds.height);
    const isPortrait = bounds.height > bounds.width;
    const currentIsLeftOfInitial = currentPoint.x <= initialPoint.x;
    const currentIsAboveInitial = currentPoint.y <= initialPoint.y;
    const fitBoundsX = currentIsLeftOfInitial
      ? isPortrait
        ? initialPoint.x - fitBoundsSize
        : currentPoint.x
      : initialPoint.x;
    const fitBoundsY = currentIsAboveInitial
      ? isPortrait
        ? currentPoint.y
        : initialPoint.y - fitBoundsSize
      : initialPoint.y;
    return Rectangle.create(
      fitBoundsX,
      fitBoundsY,
      fitBoundsSize,
      fitBoundsSize
    );
  } else {
    return bounds;
  }
};

export const transformCircle = (
  bounds: Rectangle.Rectangle,
  start: Point.Point,
  current: Point.Point,
  anchor: BoundingBox2dAnchorPosition,
  maintainAspectRatio?: boolean
): Rectangle.Rectangle => {
  const delta = Point.subtract(current, start);
  const { x: left, y: top, width: w, height: h } = bounds;
  const right = left + w;
  const bottom = top + h;
  const topLeft = Point.create(left, top);
  const bottomLeft = Point.create(left, bottom);
  const topRight = Point.create(right, top);
  const bottomRight = Point.create(right, bottom);
  switch (anchor) {
    case 'top-left':
      return createCircle(bottomRight, current, !!maintainAspectRatio);
    case 'top':
      return createCircle(
        bottomRight,
        Point.create(left, current.y),
        !!maintainAspectRatio
      );
    case 'top-right':
      return createCircle(bottomLeft, current, !!maintainAspectRatio);
    case 'right':
      return createCircle(
        bottomLeft,
        Point.create(current.x, top),
        !!maintainAspectRatio
      );
    case 'bottom-right':
      return createCircle(topLeft, current, !!maintainAspectRatio);
    case 'bottom':
      return createCircle(
        topLeft,
        Point.create(right, current.y),
        !!maintainAspectRatio
      );
    case 'bottom-left':
      return createCircle(topRight, current, !!maintainAspectRatio);
    case 'left':
      return createCircle(
        bottomRight,
        Point.create(current.x, top),
        !!maintainAspectRatio
      );
    case 'center':
      return Rectangle.create(
        bounds.x + delta.x,
        bounds.y + delta.y,
        bounds.width,
        bounds.height
      );
  }
};
