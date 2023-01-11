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
  canvasDimensions: Dimensions.Dimensions,
  includeOffset?: boolean,
  xOffset?: number,
  yOffset?: number
): Point.Point {
  const verticalScaleFactor = 1 / canvasDimensions.height;
  const horizontalScaleFactor = 1 / canvasDimensions.width;
  const canvasCenterPoint = Dimensions.center(canvasDimensions);

  const point = Point.scale(
    Point.subtract(pt, canvasCenterPoint),
    horizontalScaleFactor,
    verticalScaleFactor
  );

  if (includeOffset) {
    const offset = Point.scale(
      Point.create(xOffset, yOffset),
      horizontalScaleFactor,
      verticalScaleFactor
    );

    // We want to place the label towards the center of the screen.
    // The given point corresponds to the upper left corner of the label, so increase the offset
    // when placing it to the left or above to ensure that part of the label line is visible
    const centerIsToTheRightInXDirection = canvasCenterPoint.x > pt.x;
    const xOffsetCalculated = centerIsToTheRightInXDirection
      ? offset.x
      : -3 * offset.x;

    const centerIsBelowInYDirection = canvasCenterPoint.y > pt.y;
    const yOffsetCalculated = centerIsBelowInYDirection
      ? offset.y
      : -3 * offset.y;

    const offsetPoint = Point.add(
      point,
      Point.create(xOffsetCalculated, yOffsetCalculated)
    );

    return constrainRelativePoint(offsetPoint, Range.create(-0.5, 0.5));
  } else {
    return constrainRelativePoint(point, Range.create(-0.5, 0.5));
  }
}
