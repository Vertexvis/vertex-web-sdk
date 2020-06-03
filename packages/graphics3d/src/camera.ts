import { Vector3, Point, BoundingBox } from '@vertexvis/geometry';

export interface Camera {
  upvector: Vector3.Vector3;
  lookat: Vector3.Vector3;
  position: Vector3.Vector3;
  aspect: number;
  near: number;
  far: number;
  fovy: number;
}

export type CameraPosition = Pick<Camera, 'position' | 'lookat' | 'upvector'>;

const PI_OVER_360 = 0.008726646259972;

export const defaultPosition = (): Vector3.Vector3 => Vector3.create(1, 2, 3);

export const create = (options: Partial<Camera> = {}): Camera => {
  return {
    upvector: options.upvector || Vector3.up(),
    position: options.position || defaultPosition(),
    lookat: options.lookat || Vector3.origin(),
    aspect: options.aspect || 3 / 2,
    near: options.near || 1,
    far: options.far || 0,
    fovy: options.fovy || 45,
  };
};

/**
 * Returns a new camera where its position and lookat are offset by the given
 * `delta`.
 */
export const offset = (
  delta: Vector3.Vector3,
  cameraPosition: CameraPosition
): CameraPosition => {
  return {
    ...cameraPosition,
    position: Vector3.add(cameraPosition.position, delta),
    lookat: Vector3.add(cameraPosition.lookat, delta),
  };
};

export const fitToBoundingBox = (
  boundingBox: BoundingBox.BoundingBox,
  camera: Camera
): Camera => {
  const radius =
    1.1 *
    Vector3.magnitude(
      Vector3.subtract(boundingBox.max, BoundingBox.center(boundingBox))
    );

  // height (of scene?) over diameter
  let hOverD = Math.tan(camera.fovy * PI_OVER_360);

  if (camera.aspect < 1.0) {
    hOverD *= camera.aspect;
  }

  const distance = Math.abs(radius / hOverD);
  const vvec = Vector3.scale(distance, Vector3.normalize(viewVector(camera)));

  const lookat = BoundingBox.center(boundingBox);
  const position = Vector3.subtract(lookat, vvec);
  const near = 0.01 * distance;
  const far = distance + radius * 1.1;

  return { ...camera, lookat, position, near, far };
};

export const rotateAroundAxis = (
  angleInRadians: number,
  axis: Vector3.Vector3,
  cameraPosition: CameraPosition
): CameraPosition => {
  const newUpVector = Vector3.rotateAboutAxis(
    angleInRadians,
    cameraPosition.upvector,
    axis,
    Vector3.origin()
  );
  const newPosition = Vector3.rotateAboutAxis(
    angleInRadians,
    cameraPosition.position,
    axis,
    cameraPosition.lookat
  );
  return { ...cameraPosition, position: newPosition, upvector: newUpVector };
};

export const translateScreenToWorld = (
  cameraPosition: CameraPosition,
  point: Point.Point
): Vector3.Vector3 => {
  const u = Vector3.normalize(cameraPosition.upvector);
  const v = Vector3.normalize(
    Vector3.subtract(cameraPosition.lookat, cameraPosition.position)
  );

  const crossX = Vector3.cross(u, v);
  const crossY = Vector3.cross(v, crossX);

  return Vector3.add(
    Vector3.scale(point.x, crossX),
    Vector3.scale(point.y, crossY)
  );
};

export const update = (data: Partial<Camera>, camera: Camera): Camera => {
  return { ...camera, ...data };
};

export const viewVector = (cameraPosition: CameraPosition): Vector3.Vector3 =>
  Vector3.subtract(cameraPosition.lookat, cameraPosition.position);
