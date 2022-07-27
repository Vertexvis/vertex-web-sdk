import { Dimensions, Point } from '@vertexvis/geometry';
import { Range } from '@vertexvis/utils';

export function constrainRelativePoint(
  pt: Point.Point,
  range: Range.Range
): Point.Point {
  const constrainedX = Math.max(range.start, Math.min(range.end, pt.x));
  const constrainedY = Math.max(range.start, Math.min(range.end, pt.y));

  return Point.create(constrainedX, constrainedY);
}

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

  return constrainRelativePoint(point, Range.create(-0.5, 0.5));
}
