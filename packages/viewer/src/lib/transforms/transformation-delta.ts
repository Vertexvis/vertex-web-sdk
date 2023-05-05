import { Matrix4, Quaternion, Vector3 } from '@vertexvis/geometry';

/**
 * There are an infinite number of orthogonal vectors, this function is used to choose one.
 * @param normal
 * @returns
 */
export function chooseOrthogonalVector(
  normal: Vector3.Vector3
): Vector3.Vector3 {
  const absNorm = Vector3.create(
    Math.abs(normal.x),
    Math.abs(normal.y),
    Math.abs(normal.z)
  );
  const x = absNorm.x < absNorm.y && absNorm.x < absNorm.z ? 1.0 : 0.0;
  const y = absNorm.y <= absNorm.x && absNorm.y < absNorm.z ? 1.0 : 0.0;
  const z = absNorm.z <= absNorm.x && absNorm.z <= absNorm.y ? 1.0 : 0.0;

  const vector = Vector3.create(x, y, z);
  return Vector3.normalize(Vector3.cross(normal, vector));
}

/**
 * Computes the rotation matrix for two normal vectors.
 * @param normal1
 * @param normal2
 * @returns
 */
export function computeRotationMatrix(
  normal1: Vector3.Vector3,
  normal2: Vector3.Vector3
): Matrix4.Matrix4 {
  const angle = Vector3.angleTo(normal2, normal1);

  const dot = Vector3.dot(normal1, normal2);
  // the angle is almost 0 in this case.
  if (dot > 0.999) {
    const axisDirection = chooseOrthogonalVector(normal1);

    const quaternion = Quaternion.fromAxisAngle(axisDirection, Math.PI);
    return Matrix4.makeRotation(quaternion);
  }
  // the angle is almost 180 in this case.
  else if (dot <= -0.999) {
    return Matrix4.makeIdentity();
  }
  // the angle is between 0 & 180
  else {
    const axisDirection = Vector3.normalize(Vector3.cross(normal1, normal2));
    return Matrix4.makeRotation(
      Quaternion.fromAxisAngle(axisDirection, angle + Math.PI)
    );
  }
}
/**
 * Computes the translation & rotation matrix delta between two world positions and two normals vectors.
 * @param normal1
 * @param position1
 * @param normal2
 * @param position2
 * @returns
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
