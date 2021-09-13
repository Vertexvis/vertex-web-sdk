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

export function convertPointsToBounds(
  points: Point.Point[],
  original: Rectangle.Rectangle,
  bounds: Rectangle.Rectangle,
  start: Point.Point,
  current: Point.Point,
  canvasDimensions: Dimensions.Dimensions
): Point.Point[] {
  const originalScreen = translateRectToScreen(original, canvasDimensions);
  const boundsScreen = translateRectToScreen(bounds, canvasDimensions);

  return points
    .map((pt) => translatePointToScreen(pt, canvasDimensions))
    .map((pt) =>
      Point.scale(
        Point.subtract(pt, originalScreen),
        1 / originalScreen.width,
        1 / originalScreen.height
      )
    )
    .map((pt) => Point.scale(pt, boundsScreen.width, boundsScreen.height))
    .map((pt) => Point.add(pt, boundsScreen))
    .map((pt) => translatePointToRelative(pt, canvasDimensions));
}

export function pointsToAlternateRelative(
  points: Point.Point[],
  original: Rectangle.Rectangle,
  updated: Rectangle.Rectangle,
  canvasDimensions: Dimensions.Dimensions
): Point.Point[] {
  // const originalScaleFactor = toRelativeScaleFactor(
  //   translateDimensionsToScreen(original, canvasDimensions)
  // );
  // const originalScreen = translateDimensionsToScreen(
  //   original,
  //   canvasDimensions
  // );
  // const updatedScaleFactor = toRelativeScaleFactor(
  //   translateDimensionsToScreen(updated, canvasDimensions)
  // );
  // const updatedScreen = translateDimensionsToScreen(updated, canvasDimensions);

  // console.log(translatePointToScreen(points[0], originalScreen));
  // console.log(
  //   translatePointToRelative(
  //     Point.scale(
  //       translatePointToScreen(points[0], originalScreen),
  //       originalScaleFactor / updatedScaleFactor,
  //       originalScaleFactor / updatedScaleFactor
  //     ),
  //     updatedScreen
  //   )
  // );

  // return points.map((pt) =>
  //   translatePointToRelative(
  //     Point.scale(
  //       translatePointToScreen(pt, originalScreen),
  //       originalScaleFactor / updatedScaleFactor,
  //       originalScaleFactor / updatedScaleFactor
  //     ),
  //     updatedScreen
  //   )
  // );

  const originalAreaX = original.width; //- (original.x + 0.5);
  const updatedAreaX = updated.width; //- (updated.x + 0.5);

  const widthScaleFactor = updatedAreaX / originalAreaX;

  return points
    .map((pt) => Point.add(pt, Point.create(0.5, 0.5)))
    .map((pt) => Point.subtract(pt, Point.create(updated.x + 0.5, 0)))
    .map((pt) => Point.scale(pt, 1 / widthScaleFactor, 1))
    .map((pt) => Point.subtract(pt, Point.create(0.5, 0.5)));
}
