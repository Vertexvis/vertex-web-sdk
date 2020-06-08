import * as Point from './point';
import * as Rectangle from './rectangle';

/**
 * `Dimensions` represent an object with a length of `width` and `height`.
 */
export interface Dimensions {
  width: number;
  height: number;
}

/**
 * Returns a `Dimensions` with the given width and height.
 *
 */
export const create = (width: number, height: number): Dimensions => {
  return { width, height };
};

/**
 * Returns a `Dimensions` with the same width and height.
 */
export const square = (size: number): Dimensions => {
  return create(size, size);
};

/**
 * Returns `true` if two dimensions have the same width and height. Otherwise
 * `false`.
 */
export const isEqual = (a: Dimensions, b: Dimensions): boolean => {
  return a.width === b.width && a.height === b.height;
};

/**
 * Returns a scaled dimensions, where the width is scaled by `scaleX` and height
 * is scaled by `scaleY`.
 */
export const scale = (
  scaleX: number,
  scaleY: number,
  dimensions: Dimensions
): Dimensions => {
  return {
    width: dimensions.width * scaleX,
    height: dimensions.height * scaleY,
  };
};

/**
 * Returns a dimension where each length is scaled by `scaleFactor`.
 */
export const proportionalScale = (
  scaleFactor: number,
  dimensions: Dimensions
): Dimensions => {
  return scale(scaleFactor, scaleFactor, dimensions);
};

/**
 * Returns a `Dimensions` where the lengths of `dimensions` are trimmed to fit
 * into `to`.
 */
export const trim = (to: Dimensions, dimensions: Dimensions): Dimensions => {
  return {
    width: Math.min(to.width, dimensions.width),
    height: Math.min(to.height, dimensions.height),
  };
};

/**
 * Returns a `Dimensions` where the longest length of `dimensions` will be equal
 * to the shortest length of `to`. The shortest length of `dimensions` will be
 * proportionally scaled to match the aspect ratio of `dimensions`.
 *
 * @see #cropFit()
 */
export const containFit = (
  to: Dimensions,
  dimensions: Dimensions
): Dimensions => {
  const { width, height } = Rectangle.containFit(
    toRectangle(to),
    toRectangle(dimensions)
  );
  return { width, height };
};

/**
 * Returns a `Dimensions` where the shortest length of `dimensions` will be
 * equal to the longest length of `to`. The longest length of `dimensions` will
 * be proportionally scaled to match the aspect ratio of `dimensions`.
 *
 * @see #containFit()
 */
export const cropFit = (to: Dimensions, dimensions: Dimensions): Dimensions => {
  const { width, height } = Rectangle.cropFit(
    toRectangle(to),
    toRectangle(dimensions)
  );
  return { width, height };
};

/**
 * Returns a `Dimensions` with each length rounded.
 */
export const round = (dimensions: Dimensions): Dimensions => {
  return {
    width: Math.round(dimensions.width),
    height: Math.round(dimensions.height),
  };
};

/**
 * Returns the center point of the given `dimensions`.
 */
export const center = (dimensions: Dimensions): Point.Point => {
  return { x: dimensions.width / 2, y: dimensions.height / 2 };
};

/**
 * Returns the aspect ratio of the given `dimensions`, as defined by width over
 * height.
 */
export const aspectRatio = ({ width, height }: Dimensions): number => {
  return width / height;
};

/**
 * Returns a `Dimensions` fitted to the provided aspect ratio.
 *
 * @param ratio - Aspect ratio to fit the provided Dimensions to
 * @param dimensions - Dimensions to fit to the specified ratio
 */
export const fitToRatio = (
  ratio: number,
  dimensions: Dimensions
): Dimensions => {
  if (dimensions.width >= dimensions.height * ratio) {
    return create(dimensions.height * ratio, dimensions.height);
  }

  return create(dimensions.width, dimensions.width / ratio);
};

/**
 * Converts a dimension to a rectangle, with an optional position.
 */
export function toRectangle(
  dimensions: Dimensions,
  position: Point.Point = Point.create()
): Rectangle.Rectangle {
  return Rectangle.fromPointAndDimensions(position, dimensions);
}
