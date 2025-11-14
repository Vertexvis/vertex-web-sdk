import { vertexvis } from '@vertexvis/frame-streaming-protos';

export function validateBoundingBox(
  boundingBox: vertexvis.protobuf.core.IBoundingBox3f
): boolean {
  const boundingBoxXMaxValid =
    boundingBox?.xmax != null && Number.isFinite(boundingBox.xmax);
  const boundingBoxXMinValid =
    boundingBox?.xmin != null && Number.isFinite(boundingBox.xmin);
  const boundingBoxYMaxValid =
    boundingBox?.ymax != null && Number.isFinite(boundingBox.ymax);
  const boundingBoxYMinValid =
    boundingBox?.ymin != null && Number.isFinite(boundingBox.ymin);
  const boundingBoxZMaxValid =
    boundingBox?.zmax != null && Number.isFinite(boundingBox.zmax);
  const boundingBoxZMinValid =
    boundingBox?.zmin != null && Number.isFinite(boundingBox.zmin);

  return (
    boundingBoxXMaxValid &&
    boundingBoxXMinValid &&
    boundingBoxYMaxValid &&
    boundingBoxYMinValid &&
    boundingBoxZMaxValid &&
    boundingBoxZMinValid
  );
}

export function validateCamera(
  camera: vertexvis.protobuf.stream.ICamera
): boolean {
  // If a perspective camera is provided, verify it is valid
  if (camera.perspective != null) {
    const perspectiveCameraIsValid = validatePerspectiveCamera(
      camera.perspective
    );
    return perspectiveCameraIsValid;
  }

  // If an orthographic camera is provided, verify it is valid
  if (camera.orthographic != null) {
    const orthographicCameraIsValid = validateOrthographicCamera(
      camera.orthographic
    );
    return orthographicCameraIsValid;
  }

  return false;
}

export function validatePerspectiveCamera(
  camera: vertexvis.protobuf.stream.IPerspectiveCamera
): boolean {
  const lookAtXValid =
    camera.lookAt?.x != null && Number.isFinite(camera.lookAt.x);
  const lookAtYValid =
    camera.lookAt?.y != null && Number.isFinite(camera.lookAt.y);
  const lookAtZValid =
    camera.lookAt?.z != null && Number.isFinite(camera.lookAt.z);
  const positionXValid =
    camera.position?.x != null && Number.isFinite(camera.position.x);
  const positionYValid =
    camera.position?.y != null && Number.isFinite(camera.position.y);
  const positionZValid =
    camera.position?.z != null && Number.isFinite(camera.position.z);
  const upXValid = camera.up?.x != null && Number.isFinite(camera.up.x);
  const upYValid = camera.up?.y != null && Number.isFinite(camera.up.y);
  const upZValid = camera.up?.z != null && Number.isFinite(camera.up.z);

  // Validate up vector has non-zero length
  const upVectorValid = validateVector(
    { x: camera?.up?.x, y: camera?.up?.y, z: camera?.up?.z },
    true
  );

  return (
    lookAtXValid &&
    lookAtYValid &&
    lookAtZValid &&
    positionXValid &&
    positionYValid &&
    positionZValid &&
    upXValid &&
    upYValid &&
    upZValid &&
    upVectorValid
  );
}

export function validateOrthographicCamera(
  camera: vertexvis.protobuf.stream.IOrthographicCamera
): boolean {
  const fovHeightValid =
    camera.fovHeight != null && Number.isFinite(camera.fovHeight);
  const lookAtXValid =
    camera.lookAt?.x != null && Number.isFinite(camera.lookAt.x);
  const lookAtYValid =
    camera.lookAt?.y != null && Number.isFinite(camera.lookAt.y);
  const lookAtZValid =
    camera.lookAt?.z != null && Number.isFinite(camera.lookAt.z);
  const upXValid = camera.up?.x != null && Number.isFinite(camera.up.x);
  const upYValid = camera.up?.y != null && Number.isFinite(camera.up.y);
  const upZValid = camera.up?.z != null && Number.isFinite(camera.up.z);
  const viewVectorXValid =
    camera.viewVector?.x != null && Number.isFinite(camera.viewVector.x);
  const viewVectorYValid =
    camera.viewVector?.y != null && Number.isFinite(camera.viewVector.y);
  const viewVectorZValid =
    camera.viewVector?.z != null && Number.isFinite(camera.viewVector.z);

  // Validate up vector has non-zero length
  const upVectorValid = validateVector(
    { x: camera?.up?.x, y: camera?.up?.y, z: camera?.up?.z },
    true
  );

  return (
    fovHeightValid &&
    lookAtXValid &&
    lookAtYValid &&
    lookAtZValid &&
    viewVectorXValid &&
    viewVectorYValid &&
    viewVectorZValid &&
    upXValid &&
    upYValid &&
    upZValid &&
    upVectorValid
  );
}

export function validateDimensions(
  dimensions: vertexvis.protobuf.stream.IDimensions
): boolean {
  const heightValid =
    dimensions?.height != null &&
    Number.isFinite(dimensions.height) &&
    dimensions.height > 0;
  const widthValid =
    dimensions?.width != null &&
    Number.isFinite(dimensions.width) &&
    dimensions.width > 0;

  return heightValid && widthValid;
}

export function validateNumber(number: number): boolean {
  return number != null && Number.isFinite(number);
}

export function validatePoint(
  point: vertexvis.protobuf.stream.IPoint
): boolean {
  const xValid = point?.x != null && Number.isFinite(point.x);
  const yValid = point?.y != null && Number.isFinite(point.y);

  return xValid && yValid;
}

export function validateVector(
  vector: vertexvis.protobuf.core.IVector3f,
  verifyNonZeroLength: boolean
): boolean {
  const xValid = vector?.x != null && Number.isFinite(vector.x);
  const yValid = vector?.y != null && Number.isFinite(vector.y);
  const zValid = vector?.z != null && Number.isFinite(vector.z);

  const vectorComponentsValid = xValid && yValid && zValid;

  if (verifyNonZeroLength) {
    if (vector?.x != null && vector?.y != null && vector?.z != null) {
      const vectorMagnitudeSquared =
        vector.x * vector.x + vector.y * vector.y + vector.z * vector.z;
      const vectorHasNonZeroLength = vectorMagnitudeSquared !== 0;

      return vectorComponentsValid && vectorHasNonZeroLength;
    } else {
      // If one or more components are undefined, then the vector does not have non-zero length
      return false;
    }
  }

  return vectorComponentsValid;
}
