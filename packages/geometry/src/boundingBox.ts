import * as Vector3 from './vector3';

/**
 * A `BoundingBox` describes a bounding volume as an axis-aligned box.
 */
export interface BoundingBox {
  min: Vector3.Vector3;
  max: Vector3.Vector3;
}

/**
 * Returns a `BoundingBox` with the given min and max points.
 */
export const create = (
  min: Vector3.Vector3,
  max: Vector3.Vector3
): BoundingBox => {
  return { min, max };
};

/**
 * Construct a minimal bounding box for a set of vectors, such that all vectors
 * are contained by the bounding box.
 */
export const fromVectors = (
  vectors: Vector3.Vector3[]
): BoundingBox | undefined => {
  return union(...vectors.map((v) => create(v, v)));
};

/**
 * Returns the center point of the given `BoundingBox`.
 */
export const center = (boundingBox: BoundingBox): Vector3.Vector3 => {
  return Vector3.scale(0.5, Vector3.add(boundingBox.min, boundingBox.max));
};

/**
 * Returns the diagonal vector between the `min` and `max` vectors of the
 * given `BoundingBox`.
 */
export const diagonal = (boundingBox: BoundingBox): Vector3.Vector3 => {
  return Vector3.subtract(boundingBox.max, boundingBox.min);
};

/**
 * Returns a floating-point spatial error tolerance based on the extents of the box.
 */
export const epsilon = (boundingBox: BoundingBox): number => {
  return (
    Math.max(
      Math.max(
        Vector3.magnitude(boundingBox.max),
        Vector3.magnitude(boundingBox.min)
      ),
      Vector3.magnitude(diagonal(boundingBox))
    ) * 1e-6
  );
};

/* eslint-disable padding-line-between-statements */
/**
 * Combine two or more bounding boxes into a new minimal bounding box that
 * contains both.
 */
export function union(a: BoundingBox): BoundingBox;
export function union(a: BoundingBox, b: BoundingBox): BoundingBox;
export function union(
  a: BoundingBox,
  b: BoundingBox,
  c: BoundingBox
): BoundingBox;
export function union(
  a: BoundingBox,
  b: BoundingBox,
  c: BoundingBox,
  d: BoundingBox
): BoundingBox;
export function union(...boxes: BoundingBox[]): BoundingBox | undefined;
export function union(box: BoundingBox, ...rest: BoundingBox[]): BoundingBox {
  const boxes = [box, ...rest];
  return boxes.reduce((a, b) => {
    return create(Vector3.min(a.min, b.min), Vector3.max(a.max, b.max));
  });
}
/* eslint-enable padding-line-between-statements */

/**
 * Returns the distance between the min and max for the provided
 * bounding box for each axis.
 */
export const lengths = (box: BoundingBox): Vector3.Vector3 => {
  return Vector3.create(
    box.max.x - box.min.x,
    box.max.y - box.min.y,
    box.max.z - box.min.z
  );
};
