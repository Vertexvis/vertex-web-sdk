import { Dimensions, Point, Rectangle } from '@vertexvis/geometry';

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

/**
 * Returns the scale factor to convert screen coordinates to canvas coordinates.
 *
 * Scale factor is determined by taking the shortest side of the given
 * dimension. This behavior ensures that relative units are consistent in
 * non-square aspect ratios.
 *
 * @see toRelativeScaleFactor
 */
export function toScreenScaleFactor(dimensions: Dimensions.Dimensions): number {
  return Math.min(dimensions.width, dimensions.height);
}

/**
 * Returns the scale factor to convert canvas coordinates to screen coordinates.
 *
 * Scale factor is determined by taking the shortest side of the given
 * dimension. This behavior ensures that relative units are consistent in
 * non-square aspect ratios.
 *
 * @see toScreenScaleFactor
 */
export function toRelativeScaleFactor(
  dimensions: Dimensions.Dimensions
): number {
  return 1 / toScreenScaleFactor(dimensions);
}

export function translatePointToScreen(
  pt: Point.Point,
  canvasDimensions: Dimensions.Dimensions
): Point.Point {
  const scaleFactor = toScreenScaleFactor(canvasDimensions);
  return Point.add(
    Point.scale(pt, scaleFactor, scaleFactor),
    Dimensions.center(canvasDimensions)
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
  canvasDimensions: Dimensions.Dimensions
): Dimensions.Dimensions {
  const scaleFactor = toScreenScaleFactor(canvasDimensions);
  return Dimensions.scale(scaleFactor, scaleFactor, dimensions);
}

/**
 * Translates a rectangle in relative units, to a rectangle in screen units.
 *
 * Shape coordinates are persisted in relative units, so they can be presented
 * at any size.
 */
export function translateRectToScreen(
  rect: Rectangle.Rectangle,
  canvasDimensions: Dimensions.Dimensions
): Rectangle.Rectangle {
  const position = translatePointToScreen(rect, canvasDimensions);
  const dimensions = translateDimensionsToScreen(rect, canvasDimensions);
  return Rectangle.fromPointAndDimensions(position, dimensions);
}

/**
 * Translates a point in screen units, to a point in relative units.
 */
export function translatePointToRelative(
  pt: Point.Point,
  canvasDimensions: Dimensions.Dimensions
): Point.Point {
  const scaleFactor = toRelativeScaleFactor(canvasDimensions);
  return Point.scale(
    Point.subtract(pt, Dimensions.center(canvasDimensions)),
    scaleFactor,
    scaleFactor
  );
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
