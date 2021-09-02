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
export const toScreenScaleFactor = (
  dimensions: Dimensions.Dimensions
): number => {
  return Math.min(dimensions.width, dimensions.height);
};

/**
 * Returns the scale factor to convert canvas coordinates to screen coordinates.
 *
 * Scale factor is determined by taking the shortest side of the given
 * dimension. This behavior ensures that relative units are consistent in
 * non-square aspect ratios.
 *
 * @see toScreenScaleFactor
 */
export const toRelativeScaleFactor = (
  dimensions: Dimensions.Dimensions
): number => {
  return 1 / toScreenScaleFactor(dimensions);
};

export const translatePointToScreen = (
  pt: Point.Point,
  canvasDimensions: Dimensions.Dimensions
): Point.Point => {
  const scaleFactor = toScreenScaleFactor(canvasDimensions);
  return Point.add(
    Point.scale(pt, scaleFactor, scaleFactor),
    Dimensions.center(canvasDimensions)
  );
};

export const translateDimensionsToScreen = (
  dimensions: Dimensions.Dimensions,
  canvasDimensions: Dimensions.Dimensions
): Dimensions.Dimensions => {
  const scaleFactor = toScreenScaleFactor(canvasDimensions);
  return Dimensions.scale(scaleFactor, scaleFactor, dimensions);
};

/**
 * Translates a rectangle in relative units, to a rectangle in screen units.
 *
 * Shape coordinates are persisted in relative units, so they can be presented
 * at any size.
 */
export const translateRectToScreen = (
  rect: Rectangle.Rectangle,
  canvasDimensions: Dimensions.Dimensions
): Rectangle.Rectangle => {
  const position = translatePointToScreen(rect, canvasDimensions);
  const dimensions = translateDimensionsToScreen(rect, canvasDimensions);
  return Rectangle.fromPointAndDimensions(position, dimensions);
};

/**
 * Translates a point in screen units, to a point in relative units.
 */
export const translatePointToRelative = (
  pt: Point.Point,
  canvasDimensions: Dimensions.Dimensions
): Point.Point => {
  const scaleFactor = toRelativeScaleFactor(canvasDimensions);
  return Point.scale(
    Point.subtract(pt, Dimensions.center(canvasDimensions)),
    scaleFactor,
    scaleFactor
  );
};
