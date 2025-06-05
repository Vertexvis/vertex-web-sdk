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

export function flattenPointArray(arr: Point.Point[]): number[] {
  return arr.reduce((res, pt) => [...res, pt.x, pt.y], [] as number[]);
}

export function toRadiansTransform(transform: Transform): Transform {
  const { position, rotation: r, scale } = transform;
  const rotation = Vector3.create(
    Angle.toRadians(r.x),
    Angle.toRadians(r.y),
    Angle.toRadians(r.z)
  );

  return { position, rotation, scale };
}

export function toDegreesTransform(transform: Transform): Transform {
  const { position, rotation: r, scale } = transform;
  const rotation = Vector3.create(
    Angle.toDegrees(r.x),
    Angle.toDegrees(r.y),
    Angle.toDegrees(r.z)
  );
  return { position, rotation, scale };
}

export function toMatrix(transform: Transform): Matrix4.Matrix4 {
  const { position: t, rotation, scale } = transform;
  const r = Quaternion.fromEuler(Euler.create(rotation));
  const s = Vector3.create(scale, scale, scale);
  return Matrix4.makeTRS(t, r, s);
}

export function toTransform(matrix: Matrix4.Matrix4): Transform {
  const position = Vector3.fromMatrixPosition(matrix);
  const rotation = Euler.fromRotationMatrix(matrix);
  const { x: scale } = Vector3.fromMatrixScale(matrix);
  return { position, rotation, scale };
}

export function toWorldTransform(
  localT: Transform,
  parentWM: Matrix4.Matrix4
): Transform {
  const localM = toMatrix(toRadiansTransform(localT));
  const worldM = Matrix4.multiply(parentWM, localM);
  return toDegreesTransform(toTransform(worldM));
}

export function toLocalTransform(
  worldT: Transform,
  parentWM: Matrix4.Matrix4
): Transform {
  const worldM = toMatrix(toRadiansTransform(worldT));
  const localM = Matrix4.multiply(Matrix4.invert(parentWM), worldM);
  return toDegreesTransform(toTransform(localM));
}
