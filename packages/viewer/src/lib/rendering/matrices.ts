/**
 * @see https://openframeworks.cc/documentation/math/ofMatrix4x4/
 * @see https://github.com/openframeworks/openFrameworks/blob/356612673304e2f8b0584bc4080b58ee36db62f7/libs/openFrameworks/math/ofMatrix4x4.cpp
 */

import { Angle, Matrix4, Vector3 } from '@vertexvis/geometry';

import { FrameCamera } from '../types';
import { isOrthographicFrameCamera } from '../types/frameCamera';

/**
 * Matrix becomes a perspective projection matrix.
 *
 * Related to: glFrustum. The viewing volume is frustum-shaped and defined by
 * the six parameters. Left, right, top, and bottom specify coordinates in the
 * zNear clipping plane where the frustum edges intersect it, and the zNear and
 * zFar parameters define the forward distances of the view volume. The
 * resulting volume can be vertically and horizontally asymmetrical around the
 * center of the near plane.
 *
 * @param left The left coordinate at near.
 * @param right The right coordinate at near.
 * @param top The top coordinate at near.
 * @param bottom The bottom coordinate at near.
 * @param near The near Z value.
 * @param far The far Z value.
 * @returns A matrix.
 */
export function makeFrustumMatrix(
  left: number,
  right: number,
  top: number,
  bottom: number,
  near: number,
  far: number
): Matrix4.Matrix4 {
  const a = (right + left) / (right - left);
  const b = (top + bottom) / (top - bottom);
  const c = -(far + near) / (far - near);
  const d = (-2 * far * near) / (far - near);

  /* eslint-disable prettier/prettier */
  return [
    (2 * near) / (right - left), 0, a, 0,
    0, (2 * near) / (top - bottom), b, 0,
    0, 0, c, d,
    0, 0, -1, 0
  ];
  /* eslint-enable prettier/prettier */
}

/**
 * Matrix becomes a perspective projection matrix.
 *
 * Related to: gluPerspective. The viewing volume is frustum-shaped amd defined
 * by the four parameters. The fovy and aspect ratio are used to compute the
 * positions of the left, right, top, and bottom sides of the viewing volume in
 * the zNear plane. The fovy is the y field-of-view, the angle made by the top
 * and bottom sides of frustum if they were to intersect. The aspect ratio is
 * the width of the frustum divided by its height. Note that the resulting
 * volume is both vertically and horizontally symmetrical around the center of
 * the near plane.
 *
 * @param near The near Z value.
 * @param far The far Z value.
 * @param fovY The field of view.
 * @param aspect The aspect ratio.
 * @returns A matrix.
 */
export function makePerspectiveMatrix(
  near: number,
  far: number,
  fovY: number,
  aspect: number
): Matrix4.Matrix4 {
  const ymax = near * Math.tan(Angle.toRadians(fovY / 2.0));
  const xmax = ymax * aspect;

  const left = -xmax;
  const right = xmax;
  const top = ymax;
  const bottom = -ymax;

  return makeFrustumMatrix(left, right, top, bottom, near, far);
}

/**
 * Matrix becomes a combination of an inverse translation and rotation.
 *
 * Related to: gluLookAt. This creates the inverse of makeLookAtMatrix. The
 * matrix will be an opposite translation from the 'eye' position, and it will
 * rotate things in the opposite direction of the eye-to-center orientation.
 * This is definitely confusing, but the main reason to use this transform is to
 * set up a view matrix for a camera that's looking at a certain point. To
 * achieve the effect of moving the camera somewhere and rotating it so that it
 * points at something, the rest of the world is moved in the opposite direction
 * and rotated in the opposite way around the camera. This way, you get the same
 * effect as moving the actual camera, but all the projection math can still be
 * done with the camera positioned at the origin (which makes it way simpler).
 *
 * @param camera The camera to compute.
 * @returns A matrix.
 */
export function makeLookAtViewMatrix(
  camera: FrameCamera.FrameCamera
): Matrix4.Matrix4 {
  const { lookAt, up } = camera;
  const position = isOrthographicFrameCamera(camera)
    ? Vector3.add(camera.viewVector, camera.lookAt)
    : camera.position;

  const z = Vector3.normalize(Vector3.subtract(position, lookAt));
  const x = Vector3.normalize(Vector3.cross(up, z));
  const y = Vector3.cross(z, x);

  /* eslint-disable prettier/prettier */
  return [
    x.x, x.y, x.z, -Vector3.dot(x, position),
    y.x, y.y, y.z, -Vector3.dot(y, position),
    z.x, z.y, z.z, -Vector3.dot(z, position),
    0  , 0  , 0  , 1,
  ];
  /* eslint-enable prettier/prettier */

  return Matrix4.makeIdentity();
}

/**
 * Matrix becomes a combination of translation and rotation.
 *
 * Matrix becomes a combination of a translation to the position of 'eye' and a
 * rotation matrix which orients an object to point towards 'center' along its
 * z-axis. Use this function if you want an object to look at a point from
 * another point in space.
 *
 * @param camera The camera to compute the look at matrix for.
 * @returns A matrix.
 */
export function makeLookAtMatrix(
  camera: FrameCamera.FrameCamera
): Matrix4.Matrix4 {
  const { lookAt, up } = camera;
  const position = isOrthographicFrameCamera(camera)
    ? Vector3.add(camera.viewVector, camera.lookAt)
    : camera.position;

  const z = Vector3.normalize(Vector3.subtract(position, lookAt));
  const x = Vector3.normalize(Vector3.cross(up, z));
  const y = Vector3.cross(z, x);

  /* eslint-disable prettier/prettier */
  return [
    x.x, y.x, z.x, position.x,
    x.y, y.y, z.y, position.y,
    x.z, y.z, z.z, position.z,
    0  , 0  , 0  , 1
  ];
  /* eslint-enable prettier/prettier */

  return Matrix4.makeIdentity();
}
