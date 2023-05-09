import { Matrix4, Quaternion, Vector3 } from '@vertexvis/geometry';

export const ALMOST_ONE = 0.9999;

/**
 * For any single normal vector, there are an infinite number of potential orthogonal vectors. This function will
 * calculate a single vector evaluating the length of two candidates, and picking the one with the higher squared magnitude
 * @param normal
 * @returns
 */
export function calculateOrthogonalCoordinate(
  norm: Vector3.Vector3
): Vector3.Vector3 {
  const orthogonalCandidate0 = Vector3.create(0, norm.z, -norm.y);
  const orthogonalCandidate1 = Vector3.create(-norm.z, 0, norm.x);

  const theChosenOne =
    Vector3.magnitudeSquared(orthogonalCandidate0) >
    Vector3.magnitudeSquared(orthogonalCandidate1)
      ? orthogonalCandidate0
      : orthogonalCandidate1;

  return Vector3.normalize(Vector3.cross(norm, theChosenOne));
}

/**
 * Computes the rotation matrix for two normals. If both normals are neither parallel or anti-parallel,
 * this will compute the rotation matrix delta based on the angle from both normals.
 * If the normals are anti-parallel, the identity matrix will be returned, as no rotation is necessary in this case.
 * If the normals are parallel, an axis direction based on a chosen orthogonal vector will be used
 * to compute the rotation matrix to rotate the plane 180 degrees.
 * @param normal1
 * @param normal2
 * @returns an anti-parallel rotation Matrix4 betwen the given normals
 */
export function computeRotationMatrix(
  normal1: Vector3.Vector3,
  normal2: Vector3.Vector3
): Matrix4.Matrix4 {
  const dot = Vector3.dot(normal1, normal2);
  // the angle is almost 0 in this case.
  if (dot > ALMOST_ONE) {
    const axisDirection = calculateOrthogonalCoordinate(normal1);

    const quaternion = Quaternion.fromAxisAngle(axisDirection, Math.PI);
    return Matrix4.makeRotation(quaternion);
  }
  // the angle is almost 180 in this case.
  else if (dot <= -ALMOST_ONE) {
    return Matrix4.makeIdentity();
  }
  // the angle is between 0 & 180
  else {
    const angle = Vector3.angleTo(normal2, normal1);
    const axisDirection = Vector3.normalize(Vector3.cross(normal1, normal2));
    return Matrix4.makeRotation(
      Quaternion.fromAxisAngle(axisDirection, angle + Math.PI)
    );
  }
}

/**
 * Computes the translation & rotation matrix delta between two world positions and two normals.
 * such that the computed translation matrix will be the delta between position 1 and position 2,
 * and the rotation will be rotated to be anti-parallel.
 *
 * @param normal1
 * @param position1
 * @param normal2
 * @param position2
 *
 * @returns Matrix4 translation matrix delta from position1 to
 * position2 & an anti-parallel rotation delta.
 */
export function computeTransformationDelta(
  normal1: Vector3.Vector3,
  position1: Vector3.Vector3,
  normal2: Vector3.Vector3,
  position2: Vector3.Vector3
): Matrix4.Matrix4 {
  const rotationMatrix = computeRotationMatrix(normal1, normal2);

  const translationDeltaMatrix = Matrix4.makeTranslation(position2);
  return Matrix4.multiply(
    Matrix4.multiply(translationDeltaMatrix, rotationMatrix),
    Matrix4.makeTranslation(Vector3.negate(position1))
  );
}
