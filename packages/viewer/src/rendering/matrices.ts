import { Angle, Matrix4, Vector3 } from '@vertexvis/geometry';
import { FrameCamera } from '../types';

export function projectionMatrix(
  near: number,
  far: number,
  fovY: number,
  aspect: number
): Matrix4.Matrix4 {
  const ymax = near * Math.tan(Angle.toRadians(fovY / 2.0));
  const xmax = ymax * aspect;

  const left = -xmax;
  const right = xmax;
  const bottom = -ymax;
  const top = ymax;

  return Matrix4.create([
    (2.0 * near) / (right - left),
    0,
    0,
    0,
    0,
    (2.0 * near) / (top - bottom),
    0,
    0,
    0,
    0,
    -(far + near) / (far - near),
    -(2.0 * near * far) / (far - near),
    0,
    0,
    -1.0,
    0,
  ]);
}

export function inverseProjectionMatrix(
  near: number,
  far: number,
  fovY: number,
  aspect: number
): Matrix4.Matrix4 {
  const ymax = near * Math.tan(Angle.toRadians(fovY / 2.0));
  const xmax = ymax * aspect;

  const left = -xmax;
  const right = xmax;
  const bottom = -ymax;
  const top = ymax;

  return Matrix4.create([
    (right - left) / (2 * near),
    0,
    0,
    0,
    0,
    (top - bottom) / (2 * near),
    0,
    0,
    0,
    0,
    0,
    -1,
    0,
    0,
    -(far - near) / (2 * far * near),
    (far + near) / (2 * far * near),
  ]);
}

export function viewMatrix(
  frameCamera: FrameCamera.FrameCamera
): Matrix4.Matrix4 {
  const { lookAt, up, position } = frameCamera;
  const viewVector = Vector3.subtract(lookAt, position);
  const flippedViewVector = Vector3.scale(-1, viewVector);
  const sideVector = Vector3.normalize(Vector3.cross(up, flippedViewVector));
  const upVector = Vector3.normalize(
    Vector3.cross(flippedViewVector, sideVector)
  );
  const forwardVector = Vector3.normalize(flippedViewVector);
  const offset = Vector3.scale(-1.0, Vector3.add(lookAt, flippedViewVector));

  return Matrix4.create([
    sideVector.x,
    sideVector.y,
    sideVector.z,
    sideVector.x * offset.x + sideVector.y * offset.y + sideVector.z * offset.z,
    upVector.x,
    upVector.y,
    upVector.z,
    upVector.x * offset.x + upVector.y * offset.y + upVector.z * offset.z,
    forwardVector.x,
    forwardVector.y,
    forwardVector.z,
    forwardVector.x * offset.x +
      forwardVector.y * offset.y +
      forwardVector.z * offset.z,
    0.0,
    0.0,
    0.0,
    1.0,
  ]);
}

export function makeLookAtViewMatrix(
  camera: FrameCamera.FrameCamera
): Matrix4.Matrix4 {
  const { position, lookAt, up } = camera;

  const z = Vector3.normalize(Vector3.subtract(position, lookAt));
  const x = Vector3.normalize(Vector3.cross(up, z));
  const y = Vector3.cross(z, x);

  /* eslint-disable prettier/prettier */
  return Matrix4.create([
    x.x, x.y, x.z, -Vector3.dot(x, position),
    y.x, y.y, y.z, -Vector3.dot(y, position),
    z.x, z.y, z.z, -Vector3.dot(z, position),
    0  , 0  , 0  , 1,
  ])
  /* eslint-enable prettier/prettier */
}

export function makeViewMatrix({
  position,
  lookAt,
  up,
}: FrameCamera.FrameCamera): Matrix4.Matrix4 {
  const z = Vector3.normalize(Vector3.subtract(position, lookAt));
  const x = Vector3.normalize(Vector3.cross(up, z));
  const y = Vector3.cross(z, x);

  /* eslint-disable prettier/prettier */
  return Matrix4.create([
    x.x, y.x, z.x, position.x,
    x.y, y.y, z.y, position.y,
    x.z, y.z, z.z, position.z,
    0  , 0  , 0  , 1
  ])
  /* eslint-enable prettier/prettier */
}

export function inverseViewMatrix(
  frameCamera: FrameCamera.FrameCamera
): Matrix4.Matrix4 {
  const { lookAt, up, position } = frameCamera;
  const viewVector = Vector3.subtract(lookAt, position);
  const flippedViewVector = Vector3.scale(-1, viewVector);
  const sideVector = Vector3.normalize(Vector3.cross(up, flippedViewVector));
  const upVector = Vector3.normalize(
    Vector3.cross(flippedViewVector, sideVector)
  );
  const forwardVector = Vector3.normalize(flippedViewVector);
  const offset = Vector3.scale(-1, Vector3.add(lookAt, flippedViewVector));

  const rotationTranspose = Matrix4.create([
    sideVector.x,
    upVector.x,
    forwardVector.x,
    0,
    sideVector.y,
    upVector.y,
    forwardVector.y,
    0,
    sideVector.z,
    upVector.z,
    forwardVector.z,
    0,
    0,
    0,
    0,
    1.0,
  ]);

  const translation = Matrix4.multiplyVector3(
    rotationTranspose,
    Vector3.create(
      sideVector.x * offset.x +
        sideVector.y * offset.y +
        sideVector.z * offset.z,
      upVector.x * offset.x + upVector.y * offset.y + upVector.z * offset.z,
      forwardVector.x * offset.x +
        forwardVector.y * offset.y +
        forwardVector.z * offset.z
    )
  );

  return Matrix4.create([
    sideVector.x,
    upVector.x,
    forwardVector.x,
    -translation.x,
    sideVector.y,
    upVector.y,
    forwardVector.y,
    -translation.y,
    sideVector.z,
    upVector.z,
    forwardVector.z,
    -translation.z,
    0,
    0,
    0,
    1.0,
  ]);
}

export function lookAtMatrix(camera: FrameCamera.FrameCamera): Matrix4.Matrix4 {
  const { position, lookAt, up } = camera;

  const forwardV = Vector3.normalize(Vector3.subtract(lookAt, position));
  const sideV = Vector3.normalize(Vector3.cross(forwardV, up));
  const upV = Vector3.cross(sideV, forwardV);

  /* eslint-disable prettier/prettier */
  const matrix = [
    sideV.x, upV.x, -forwardV.x, 0,
    sideV.y, upV.y, -forwardV.y, 0,
    sideV.z, upV.z, -forwardV.z, 0,
    0, 0, 0, 1,
  ]

  const transpose = [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    -position.x, -position.y, -position.z, 1
  ]
  /* eslint-enable prettier/prettier */

  return Matrix4.create(Matrix4.multiply(matrix, transpose));
}
