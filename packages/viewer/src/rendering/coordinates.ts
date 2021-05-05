import {
  Angle,
  Dimensions,
  Matrix4,
  Point,
  Vector3,
} from '@vertexvis/geometry';

export function computeWorldPosition(
  inverseProjection: Matrix4.Matrix4,
  inverseView: Matrix4.Matrix4,
  viewport: Dimensions.Dimensions,
  point: Point.Point,
  depth: number,
  near: number,
  far: number,
  viewVector: Vector3.Vector3,
  normalizedViewVector: Vector3.Vector3,
  position: Vector3.Vector3,
  crossX: Vector3.Vector3,
  crossY: Vector3.Vector3,
  aspect: number,
  fovy: number
): Vector3.Vector3 {
  const rayDir = Vector3.create(
    (point.x / viewport.width - 0.5) * aspect,
    -(point.y / viewport.height) + 0.5,
    -0.5 / Math.tan(Angle.toRadians(fovy / 2.0))
  );

  const normalized = Vector3.normalize(
    Vector3.add(
      Vector3.scale(rayDir.x, Vector3.scale(-1, crossX)),
      Vector3.scale(rayDir.y, crossY),
      Vector3.scale(rayDir.z, Vector3.scale(-1, normalizedViewVector))
    )
  );
  const pointAtViewVector = Vector3.subtract(
    Vector3.add(
      position,
      Vector3.scale(linearDepth(depth, near, far), normalized)
    ),
    position
  );

  const a =
    Vector3.dot(viewVector, pointAtViewVector) /
    (Vector3.magnitude(viewVector) * Vector3.magnitude(pointAtViewVector));

  const angle =
    Math.abs((point.x / viewport.width) * fovy - fovy / 2) / aspect +
    Math.abs((point.y / viewport.height) * fovy - fovy / 2);
  console.log(a);
  const relativeDepth = depth / Math.cos(Angle.toRadians(angle));
  // const relativeDepth = depth / a;
  console.log(relativeDepth);

  return Vector3.add(
    position,
    Vector3.scale(linearDepth(depth, near, far) / a, normalized)
  );
}

export function linearDepth(depth: number, near: number, far: number): number {
  return depth * (far - near) + near;
}
