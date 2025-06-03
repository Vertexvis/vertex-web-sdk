import { vertexvis } from '@vertexvis/frame-streaming-protos';
import {
  BoundingBox,
  Dimensions,
  Matrix4,
  Plane,
  Rectangle,
  Vector3,
  Vector4,
} from '@vertexvis/geometry';
import { Mapper as M } from '@vertexvis/utils';

export const fromPbDim: M.Func<
  vertexvis.protobuf.stream.IDimensions,
  Dimensions.Dimensions
> = M.defineMapper(
  M.read(M.requiredProp('width'), M.requiredProp('height')),
  ([width, height]) => Dimensions.create(width, height)
);

export const fromPbRect: M.Func<
  vertexvis.protobuf.stream.IRectangle,
  Rectangle.Rectangle
> = M.defineMapper(
  M.read(
    M.requiredProp('x'),
    M.requiredProp('y'),
    M.requiredProp('width'),
    M.requiredProp('height')
  ),
  ([x, y, width, height]) => Rectangle.create(x, y, width, height)
);

export const fromPbVector3f: M.Func<
  vertexvis.protobuf.core.IVector3f,
  Vector3.Vector3
> = M.defineMapper(
  M.read(M.requiredProp('x'), M.requiredProp('y'), M.requiredProp('z')),
  ([x, y, z]) => Vector3.create(x, y, z)
);

export const fromPbBoundingBox3f: M.Func<
  vertexvis.protobuf.core.IBoundingBox3f,
  BoundingBox.BoundingBox
> = M.defineMapper(
  M.read(
    M.requiredProp('xmin'),
    M.requiredProp('ymin'),
    M.requiredProp('zmin'),
    M.requiredProp('xmax'),
    M.requiredProp('ymax'),
    M.requiredProp('zmax')
  ),
  ([xmin, ymin, zmin, xmax, ymax, zmax]) =>
    BoundingBox.create(
      Vector3.create(xmin, ymin, zmin),
      Vector3.create(xmax, ymax, zmax)
    )
);

export const fromPbPlane: M.Func<vertexvis.protobuf.core.IPlane, Plane.Plane> =
  M.defineMapper(
    M.read(M.requiredProp('d'), M.mapRequiredProp('normal', fromPbVector3f)),
    ([constant, normal]) => Plane.create({ normal, constant })
  );

export const fromPbVector4f: M.Func<
  vertexvis.protobuf.core.IVector4f,
  Vector4.Vector4
> = M.defineMapper(
  M.read(
    M.requiredProp('x'),
    M.requiredProp('y'),
    M.requiredProp('z'),
    M.requiredProp('w')
  ),
  ([x, y, z, w]) => Vector4.create({ x, y, z, w })
);

export const fromPbMatrix4f: M.Func<
  vertexvis.protobuf.core.IMatrix4x4f,
  Matrix4.Matrix4
> = M.defineMapper(
  M.read(
    M.mapRequiredProp('r0', fromPbVector4f),
    M.mapRequiredProp('r1', fromPbVector4f),
    M.mapRequiredProp('r2', fromPbVector4f),
    M.mapRequiredProp('r3', fromPbVector4f)
  ),
  ([r0, r1, r2, r3]) =>
    Matrix4.fromValues(
      r0.x,
      r0.y,
      r0.z,
      r0.w,
      r1.x,
      r1.y,
      r1.z,
      r1.w,
      r2.x,
      r2.y,
      r2.z,
      r2.w,
      r3.x,
      r3.y,
      r3.z,
      r3.w
    )
);
