import { vertexvis } from '@vertexvis/frame-streaming-protos';

export function validateBoundingBox(
  boundingBox: vertexvis.protobuf.core.IBoundingBox3f,
): boolean {
  return (
    boundingBox != null &&
    validateNumber(boundingBox.xmax) &&
    validateNumber(boundingBox.xmin) &&
    validateNumber(boundingBox.ymax) &&
    validateNumber(boundingBox.ymin) &&
    validateNumber(boundingBox.zmax) &&
    validateNumber(boundingBox.zmin)
  );
}

export function validateCamera(
  camera: vertexvis.protobuf.stream.ICamera,
): boolean {
  // If a perspective camera is provided, verify it is valid
  if (camera.perspective != null) {
    const perspectiveCameraIsValid = validatePerspectiveCamera(
      camera.perspective,
    );
    return perspectiveCameraIsValid;
  }

  // If an orthographic camera is provided, verify it is valid
  if (camera.orthographic != null) {
    const orthographicCameraIsValid = validateOrthographicCamera(
      camera.orthographic,
    );
    return orthographicCameraIsValid;
  }

  return false;
}

export function validatePerspectiveCamera(
  camera: vertexvis.protobuf.stream.IPerspectiveCamera,
): boolean {
  return (
    validateVector(camera.lookAt, false) &&
    validateVector(camera.position, false) &&
    validateVector(camera.up, true)
  );
}

export function validateOrthographicCamera(
  camera: vertexvis.protobuf.stream.IOrthographicCamera,
): boolean {
  return (
    validatePositiveNumber(camera.fovHeight) &&
    validateVector(camera.lookAt, false) &&
    validateVector(camera.viewVector, false) &&
    validateVector(camera.up, true)
  );
}

export function validateDimensions(
  dimensions: vertexvis.protobuf.stream.IDimensions,
): boolean {
  return (
    validatePositiveNumber(dimensions?.height) &&
    validatePositiveNumber(dimensions?.width)
  );
}

export function validateNumber(
  number: number | null | undefined,
): number is number {
  return typeof number === 'number' && Number.isFinite(number);
}

function validatePositiveNumber(number: number | null | undefined): boolean {
  return validateNumber(number) && number > 0;
}

/*
function validateFovY(number: number | null | undefined): boolean {
  return validateNumber(number) && number >= 1 && number <= 179;
}
*/

export function validatePoint(
  point: vertexvis.protobuf.stream.IPoint | null | undefined,
): boolean {
  return validateNumber(point?.x) && validateNumber(point?.y);
}

export function validateVector(
  vector: vertexvis.protobuf.core.IVector3f | null | undefined,
  verifyNonZeroLength: boolean,
): boolean {
  if (vector == null) {
    return false;
  }

  const vectorComponentsValid =
    validateNumber(vector.x) &&
    validateNumber(vector.y) &&
    validateNumber(vector.z);

  if (verifyNonZeroLength) {
    if (!vectorComponentsValid) {
      return false;
    }

    const x = vector.x as number;
    const y = vector.y as number;
    const z = vector.z as number;
    const vectorMagnitudeSquared = x * x + y * y + z * z;

    return vectorMagnitudeSquared !== 0;
  }

  return vectorComponentsValid;
}
