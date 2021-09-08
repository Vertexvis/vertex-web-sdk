import * as Dimensions from './dimensions';
import * as Point from './point';

/**
 * A `Rectangle` is an object with position and size.
 */
export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Returns a new `Rectangle` with the given position and size.
 */
export function create(
  x: number,
  y: number,
  width: number,
  height: number
): Rectangle {
  return { x, y, width, height };
}

/**
 * Returns a new `Rectangle` at the origin point and given size.
 */
export function fromDimensions(dimensions: Dimensions.Dimensions): Rectangle {
  return create(0, 0, dimensions.width, dimensions.height);
}

/**
 * Returns a new `Rectangle` with the given position and size.
 */
export function fromPointAndDimensions(
  point: Point.Point,
  dimensions: Dimensions.Dimensions
): Rectangle {
  return create(point.x, point.y, dimensions.width, dimensions.height);
}

/**
 * Returns a new `Rectangle` with the given top-left and bottom-right positions.
 * The returned rectangle will always returns a positive width and height.
 */
export function fromPoints(
  topLeftPt: Point.Point,
  bottomRightPt: Point.Point
): Rectangle {
  const minX = Math.min(topLeftPt.x, bottomRightPt.x);
  const minY = Math.min(topLeftPt.y, bottomRightPt.y);
  const maxX = Math.max(topLeftPt.x, bottomRightPt.x);
  const maxY = Math.max(topLeftPt.y, bottomRightPt.y);
  return create(minX, minY, maxX - minX, maxY - minY);
}

/**
 * Returns a rectangle where the longest length of `rect` will be equal to the
 * shortest length of `to`. The shortest length of `rect` will be proportionally
 * scaled to match the aspect ratio of `rect`. The returned rectangle will be
 * centered within `to`.
 *
 * @see {@link cropFit}
 */
export function containFit(to: Rectangle, rect: Rectangle): Rectangle {
  const scale = Math.min(to.width / rect.width, to.height / rect.height);
  const dimensions = Dimensions.proportionalScale(scale, rect);
  const position = Point.subtract(center(to), Dimensions.center(dimensions));
  return fromPointAndDimensions(position, dimensions);
}

/**
 * Returns a rectangle where the shortest length of `rect` will be equal to the
 * longest length of `to`. The longest length of `rect` will be proportionally
 * scaled to match the aspect ratio of `rect`. The returned rectangle will be
 * centered within `to`.
 *
 * @see {@link containFit}
 */
export function cropFit(to: Rectangle, rect: Rectangle): Rectangle {
  const scale = Math.max(to.width / rect.width, to.height / rect.height);
  const dimensions = Dimensions.proportionalScale(scale, rect);
  const position = Point.subtract(center(to), Dimensions.center(dimensions));
  return fromPointAndDimensions(position, dimensions);
}

/**
 * Returns a rectangle where each side of `rect` will be reduced proportionally
 * to have an area less than or equal to the provided `to` value. The returned
 * rectangle will be centered within the original bounds of `rect`.
 *
 * @param to - the maximum area this rectangle can have
 * @param rect - the rectangle to scale to fit the specified area
 */
export function scaleFit(to: number, rect: Rectangle): Rectangle {
  const scale = Math.min(Math.sqrt(to / area(rect)), 1);
  const dimensions = Dimensions.floor(
    Dimensions.proportionalScale(scale, rect)
  );
  const position = Point.subtract(center(rect), Dimensions.center(dimensions));
  return fromPointAndDimensions(position, dimensions);
}

/**
 * Returns a rectangle where the position and dimensions are scaled by the given
 * factors. If `scaleY` is omitted, then the position and dimensions are scaled
 * uniformly by `scaleOrScaleX`.
 *
 * @param rect The rectangle to scale.
 * @param scaleOrScaleX The uniform scale factor, or the horizontal scale
 *  factor.
 * @param scaleY The vertical scale factor.
 * @returns A scaled rectangle.
 */
export function scale(
  rect: Rectangle,
  scaleOrScaleX: number,
  scaleY?: number
): Rectangle {
  if (scaleY == null) {
    return scale(rect, scaleOrScaleX, scaleOrScaleX);
  } else {
    const { x, y, width, height } = rect;
    const scaleX = scaleOrScaleX;
    return create(x * scaleX, y * scaleY, width * scaleX, height * scaleY);
  }
}

/**
 * Returns true if two rectangles are equal in position and size.
 */
export function isEqual(a: Rectangle, b: Rectangle): boolean {
  return Point.isEqual(a, b) && Dimensions.isEqual(a, b);
}

/**
 * Returns a rectangle that has its position shifted by a given offset. The
 * size of the rectangle is unchanged.
 */
export function offset(delta: Point.Point, rect: Rectangle): Rectangle {
  return fromPointAndDimensions(Point.add(topLeft(rect), delta), rect);
}

/**
 * Returns the area of the rectangle.
 */
export function area(rect: Rectangle): number {
  return rect.width * rect.height;
}

/**
 * Returns the center point of the rectangle.
 */
export function center(rect: Rectangle): Point.Point {
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
}

/**
 * Returns the top-left position of the rectangle, as a point.
 */
export function topLeft(rect: Rectangle): Point.Point {
  return Point.create(rect.x, rect.y);
}

/**
 * Returns the bottom-right position of the rectangle, as a point.
 */
export function bottomRight(rect: Rectangle): Point.Point {
  return Point.create(rect.x + rect.width, rect.y + rect.height);
}

/**
 * Returns `true` if the given rectangle has a portrait aspect ratio.
 */
export function isPortrait(rect: Rectangle): boolean {
  return rect.width < rect.height;
}

/**
 * Returns `true` if the given rectangle has a landscape aspect ratio.
 */
export function isLandscape(rect: Rectangle): boolean {
  return rect.width > rect.height;
}

/**
 * Returns `true` if the given rectangle has a square aspect ratio.
 */
export function isSquare(rect: Rectangle): boolean {
  return rect.width === rect.height;
}

/**
 * Pads a rectangle by the given amount, maintaining the center position.
 *
 * @param rect The rectangle to apply padding to.
 * @param padding The padding to add.
 */
export function pad(rect: Rectangle, padding: number): Rectangle {
  return create(
    rect.x - padding,
    rect.y - padding,
    rect.width + padding * 2,
    rect.height + padding * 2
  );
}

/**
 * Parses a JSON string representation of a Rectangle and returns an object.
 *
 * @param json A JSON string, either in the form `[x,y,width,height]` or `{"x": 0, "y": 0, "width": 10, "height": 10}`
 * @returns A parsed Point.
 */
export function fromJson(json: string): Rectangle {
  const obj = JSON.parse(json);
  if (Array.isArray(obj)) {
    const [x, y, width, height] = obj;
    return create(x, y, width, height);
  } else {
    const { x, y, width, height } = obj;
    return create(x, y, width, height);
  }
}
