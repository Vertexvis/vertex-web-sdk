import { Dimensions, Point, Rectangle } from '@vertexvis/geometry';

import { MarkupCenteringBehavior } from '../../lib/types';
import { isVertexViewerArrowMarkup } from '../viewer-markup-arrow/utils';
import { isVertexViewerCircleMarkup } from '../viewer-markup-circle/utils';
import { isVertexViewerFreeformMarkup } from '../viewer-markup-freeform/utils';

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

export function translatePointToScreen(
  pt: Point.Point,
  canvasDimensions: Dimensions.Dimensions,
  contentDimensions: Dimensions.Dimensions = canvasDimensions,
  centeringBehavior: MarkupCenteringBehavior = 'none',
  scale = 1
): Point.Point {
  const canvasToContentScaleFactor = Math.min(
    canvasDimensions.width / contentDimensions.width,
    canvasDimensions.height / contentDimensions.height
  );
  const effectiveScalar = canvasToContentScaleFactor * scale;
  const contentRelativePoint = Point.add(
    Point.scale(pt, contentDimensions.height, contentDimensions.height),
    Dimensions.center(contentDimensions)
  );

  // Include an offset for width and height to account for cases where the
  // content dimensions are smaller than the canvas dimensions.
  const scaledContentWidth = contentDimensions.width * effectiveScalar;
  const scaledContentHeight = contentDimensions.height * effectiveScalar;
  const centerOffsetX =
    centeringBehavior === 'both' || centeringBehavior === 'x-only'
      ? Math.max(0, (canvasDimensions.width - scaledContentWidth) / 2)
      : 0;
  const centerOffsetY =
    centeringBehavior === 'both' || centeringBehavior === 'y-only'
      ? Math.max(0, (canvasDimensions.height - scaledContentHeight) / 2)
      : 0;

  return Point.create(
    contentRelativePoint.x * effectiveScalar + centerOffsetX,
    contentRelativePoint.y * effectiveScalar + centerOffsetY
  );
}

export function translatePointToBounds(
  pt: Point.Point,
  rect: Rectangle.Rectangle,
  canvasDimensions: Dimensions.Dimensions
): Point.Point {
  const rectToScreen = translateRectToScreen(rect, canvasDimensions);
  return Point.add(pt, rectToScreen);
}

export function translateDimensionsToScreen(
  dimensions: Dimensions.Dimensions,
  canvasDimensions: Dimensions.Dimensions,
  contentDimensions: Dimensions.Dimensions = canvasDimensions,
  scale = 1
): Dimensions.Dimensions {
  const canvasToContentScaleFactor = Math.min(
    canvasDimensions.width / contentDimensions.width,
    canvasDimensions.height / contentDimensions.height
  );
  const effectiveScalar = canvasToContentScaleFactor * scale;
  const contentRelativeDimensions = Dimensions.scale(
    contentDimensions.height,
    contentDimensions.height,
    dimensions
  );

  return Dimensions.scale(
    effectiveScalar,
    effectiveScalar,
    contentRelativeDimensions
  );
}

/**
 * Translates a rectangle in relative units, to a rectangle in screen units.
 *
 * Shape coordinates are persisted in relative units, so they can be presented
 * at any size.
 */
export function translateRectToScreen(
  rect: Rectangle.Rectangle,
  canvasDimensions: Dimensions.Dimensions,
  contentDimensions?: Dimensions.Dimensions,
  centeringBehavior: MarkupCenteringBehavior = 'none',
  scale = 1
): Rectangle.Rectangle {
  const position = translatePointToScreen(
    rect,
    canvasDimensions,
    contentDimensions,
    centeringBehavior,
    scale
  );
  const dimensions = translateDimensionsToScreen(
    rect,
    canvasDimensions,
    contentDimensions,
    scale
  );
  return Rectangle.fromPointAndDimensions(position, dimensions);
}

/**
 * Translates a point in screen units, to a point in relative units.
 */
export function translatePointToRelative(
  pt: Point.Point,
  canvasDimensions: Dimensions.Dimensions
): Point.Point {
  const scaleFactor = 1 / canvasDimensions.height;
  const point = Point.scale(
    Point.subtract(pt, Dimensions.center(canvasDimensions)),
    scaleFactor,
    scaleFactor
  );

  return point;
}

/**
 * Translates a set of points in relative `original` units to
 * points in relative `bounds` units.
 */
export function translatePointsToBounds(
  points: Point.Point[],
  original: Rectangle.Rectangle,
  bounds: Rectangle.Rectangle
): Point.Point[] {
  return points.map((pt) =>
    Point.add(
      Point.scale(
        Point.subtract(pt, original),
        bounds.width / (original.width || 1),
        bounds.height / (original.height || 1)
      ),
      bounds
    )
  );
}

export function createRectangle(
  initialPoint: Point.Point,
  currentPoint: Point.Point,
  maintainAspectRatio: boolean
): Rectangle.Rectangle {
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
}

export function transformRectangle(
  bounds: Rectangle.Rectangle,
  start: Point.Point,
  current: Point.Point,
  anchor: BoundingBox2dAnchorPosition,
  maintainAspectRatio?: boolean
): Rectangle.Rectangle {
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
      return createRectangle(bottomRight, current, !!maintainAspectRatio);
    case 'top':
      return createRectangle(
        bottomRight,
        Point.create(left, current.y),
        !!maintainAspectRatio
      );
    case 'top-right':
      return createRectangle(bottomLeft, current, !!maintainAspectRatio);
    case 'right':
      return createRectangle(
        bottomLeft,
        Point.create(current.x, top),
        !!maintainAspectRatio
      );
    case 'bottom-right':
      return createRectangle(topLeft, current, !!maintainAspectRatio);
    case 'bottom':
      return createRectangle(
        topLeft,
        Point.create(right, current.y),
        !!maintainAspectRatio
      );
    case 'bottom-left':
      return createRectangle(topRight, current, !!maintainAspectRatio);
    case 'left':
      return createRectangle(
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
}

export function isVertexViewerMarkupElement(
  el: HTMLElement
): el is
  | HTMLVertexViewerMarkupArrowElement
  | HTMLVertexViewerMarkupCircleElement
  | HTMLVertexViewerMarkupFreeformElement {
  return (
    isVertexViewerArrowMarkup(el) ||
    isVertexViewerCircleMarkup(el) ||
    isVertexViewerFreeformMarkup(el)
  );
}

export function isValidPointData(...points: Point.Point[]): boolean {
  return points.every((pt) => !isNaN(pt.x) && !isNaN(pt.y));
}

export function isValidStartEvent(event: PointerEvent): boolean {
  const el = event.target as HTMLElement;

  return isVertexViewerMarkupElement(el) && el.mode !== 'edit';
}
