import { Dimensions, Point } from '@vertexvis/geometry';

/**
 * Translates a point in relative units to a point in screen units.
 */
export function translatePointToScreen(
  pt: Point.Point,
  canvasDimensions: Dimensions.Dimensions
): Point.Point {
  return Point.add(
    Point.scale(pt, canvasDimensions.width, canvasDimensions.height),
    Dimensions.center(canvasDimensions)
  );
}

/**
 * Translates a point in screen units to a point in relative units.
 */
export function translatePointToRelative(
  pt: Point.Point,
  canvasDimensions: Dimensions.Dimensions
): Point.Point {
  const point = Point.scale(
    Point.subtract(pt, Dimensions.center(canvasDimensions)),
    1 / canvasDimensions.width,
    1 / canvasDimensions.height
  );

  return point;
}
