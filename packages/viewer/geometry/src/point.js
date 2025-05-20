/*!
 * Copyright (c) 2025 Vertex Software LLC. All rights reserved.
 */
import { lerp as lerpNumber } from './math';

/**
 * Returns a new `Point` with the given horizontal and vertical position.
 */
export function create(x = 0, y = 0) {
  return { x, y };
}
/**
 * Converts a polar coordinate (length and angle) into a Cartesian coordinate.
 */
export function polar(length, radians) {
  const x = Math.cos(radians) * length;
  const y = Math.sin(radians) * length;
  return create(x, y);
}
/**
 * Returns the distance between two points.
 */
export function distance(a, b) {
  const delta = subtract(a, b);
  return Math.sqrt(delta.x * delta.x + delta.y * delta.y);
}
/**
 * Returns a new `Point` where `b` is subtracted from `a`.
 */
export function subtract(a, b) {
  return { x: a.x - b.x, y: a.y - b.y };
}
/**
 * Returns a new `Point` where `b` is added to `a`.
 */
export function add(a, b) {
  return { x: a.x + b.x, y: a.y + b.y };
}
/**
 * Returns `true` if the `x` and `y` positions of `a` and `b` are equal.
 */
export function isEqual(a, b) {
  return a.x === b.x && a.y === b.y;
}
/**
 * Performs a linear interpolation between `a` and `b` and returns the result.
 * The value of `t` is clamped between `[0, 1]`.
 *
 * @param a The start value.
 * @param b The end value.
 * @param t A value between 0 and 1.
 * @returns A point between `a` and `b`.
 */
export function lerp(a, b, t) {
  return {
    x: lerpNumber(a.x, b.x, t),
    y: lerpNumber(a.y, b.y, t),
  };
}
/**
 * Returns a new `Point` where `x` and `y` are inverted.
 */
export function negate(pt) {
  return create(-pt.x, -pt.y);
}
/**
 * Returns a new `Point` where `x` and `y` are multiplied by the given scale
 * factors.
 */
export function scale(pt, scaleX, scaleY) {
  return {
    x: pt.x * scaleX,
    y: pt.y * scaleY,
  };
}
/**
 * Returns a new `Point` where `x` and `y` are multiplied by the given scale
 * factor.
 */
export function scaleProportional(pt, scale) {
  return {
    x: pt.x * scale,
    y: pt.y * scale,
  };
}
/**
 * Returns the magnitude of a point.
 */
export function magnitude(pt) {
  return Math.sqrt(pt.x * pt.x + pt.y * pt.y);
}
/**
 * Transforms a vector into the corresponding normal (unit) vector.
 */
export function normalizeVector(pt) {
  const magnitudeOfPoint = magnitude(pt);
  if (magnitudeOfPoint === 0) {
    return create(0, 0);
  } else {
    return scaleProportional(pt, 1 / magnitudeOfPoint);
  }
}
/**
 * Returns a new normal (unit) vector pointing between the two given points.
 */
export function normalDirectionVector(ptA, ptB) {
  return normalizeVector(subtract(ptB, ptA));
}
/**
 * Returns a vector orthogonal to the vector between the two given points.
 */
export function orthogonalVector(ptA, ptB) {
  const unitVectorBetweenPoints = normalDirectionVector(ptA, ptB);
  // Handle vectors that are parallel to the x or y axis
  if (unitVectorBetweenPoints.x === 0 || unitVectorBetweenPoints.y === 0) {
    return create(-1 * unitVectorBetweenPoints.y, unitVectorBetweenPoints.x);
  }
  if (
    Math.abs(unitVectorBetweenPoints.x) > Math.abs(unitVectorBetweenPoints.y)
  ) {
    const vectorXValue = 1 - Math.pow(unitVectorBetweenPoints.x, 2);
    const vectorYValue =
      -1 * unitVectorBetweenPoints.x * unitVectorBetweenPoints.y;
    return normalizeVector(create(vectorXValue, vectorYValue));
  } else {
    const vectorXValue =
      -1 * unitVectorBetweenPoints.x * unitVectorBetweenPoints.y;
    const vectorYValue = 1 - Math.pow(unitVectorBetweenPoints.y, 2);
    return normalizeVector(create(vectorXValue, vectorYValue));
  }
}
/**
 * Parses a JSON string representation of a Point and returns an object.
 *
 * @param json A JSON string, either in the form `[x,y]` or `{"x": 0, "y": 0}`
 * @returns A parsed Point.
 */
export function fromJson(json) {
  const obj = JSON.parse(json);
  if (Array.isArray(obj)) {
    const [x, y] = obj;
    return create(x, y);
  } else {
    const { x, y } = obj;
    return create(x, y);
  }
}
//# sourceMappingURL=point.js.map
