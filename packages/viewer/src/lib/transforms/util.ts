import {
  Angle,
  Euler,
  Matrix4,
  Point,
  Quaternion,
  Vector3,
} from '@vertexvis/geometry';

/**
 * A type that wraps the local and world transforms for an item.
 */
export interface Transform {
  position: Vector3.Vector3;
  rotation: Vector3.Vector3;
  scale: number;
}

/**
 * Converts an array of points to an array of numbers
 * @param arr The array to convert
 * @returns The given array as an array of numbers
 */
export function flattenPointArray(arr: Point.Point[]): number[] {
  return arr.reduce((res, pt) => [...res, pt.x, pt.y], [] as number[]);
}

/**
 * Converts the rotation vector of a Transform from degrees to radians
 * @param transform The Transform to convert
 * @returns The Transform where the rotation matrix is in terms of radians
 */
export function toRadiansTransform(transform: Transform): Transform {
  const { position, rotation: r, scale } = transform;
  const rotation = Vector3.create(
    Angle.toRadians(r.x),
    Angle.toRadians(r.y),
    Angle.toRadians(r.z)
  );

  return { position, rotation, scale };
}

/**
 * Converts the rotation vector of a Transform from radians to degrees
 * @param transform The Transform to convert
 * @returns The Transform where the rotation matrix is in terms of degrees
 */
export function toDegreesTransform(transform: Transform): Transform {
  const { position, rotation: r, scale } = transform;
  const rotation = Vector3.create(
    Angle.toDegrees(r.x),
    Angle.toDegrees(r.y),
    Angle.toDegrees(r.z)
  );
  return { position, rotation, scale };
}

/**
 * Converts a Transform to a Matrix4 transform
 * @param transform The Transform to convert
 * @returns The transform as a Matrix4
 */
export function toMatrix(transform: Transform): Matrix4.Matrix4 {
  const { position: t, rotation, scale } = transform;
  const r = Quaternion.fromEuler(Euler.create(rotation));
  const s = Vector3.create(scale, scale, scale);
  return Matrix4.makeTRS(t, r, s);
}

/**
 * Converts a Matrix4 transform to a Transform
 * @param matrix The Matrix4 transform to convert
 * @returns The transform as a Transform
 */
export function toTransform(matrix: Matrix4.Matrix4): Transform {
  const position = Vector3.fromMatrixPosition(matrix);
  const rotation = Euler.fromRotationMatrix(matrix);
  const { x: scale } = Vector3.fromMatrixScale(matrix);
  return { position, rotation, scale };
}

/**
 * Converts a local transform to a world transform relative to the given parent world matrix.
 * @param localT The local transform to convert
 * @param parentWM The world matrix of the item's parent
 * @returns The world transform of the item
 */
export function toWorldTransform(
  localT: Transform,
  parentWM: Matrix4.Matrix4
): Transform {
  const localM = toMatrix(toRadiansTransform(localT));
  const worldM = Matrix4.multiply(parentWM, localM);
  return toDegreesTransform(toTransform(worldM));
}

/**
 * Converts a world transform to a local transform relative to the given parent world matrix.
 * @param worldT The world transform to convert
 * @param parentWM The world matrix of the item's parent
 * @returns The local transform of the item
 */
export function toLocalTransform(
  worldT: Transform,
  parentWM: Matrix4.Matrix4
): Transform {
  const worldM = toMatrix(toRadiansTransform(worldT));
  const localM = Matrix4.multiply(Matrix4.invert(parentWM), worldM);
  return toDegreesTransform(toTransform(localM));
}
