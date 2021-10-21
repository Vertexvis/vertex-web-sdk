import { vertexvis } from '@vertexvis/frame-streaming-protos';
import {
  BoundingBox,
  Dimensions,
  Plane,
  Rectangle,
  Vector3,
} from '@vertexvis/geometry';
import { Mapper as M } from '@vertexvis/utils';

export const mapDim: M.Func<
  vertexvis.protobuf.stream.IDimensions,
  Dimensions.Dimensions
> = M.defineMapper(
  M.read(M.requiredProp('width'), M.requiredProp('height')),
  ([width, height]) => Dimensions.create(width, height)
);

export const mapRect: M.Func<
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

export const mapVector3f: M.Func<
  vertexvis.protobuf.core.IVector3f,
  Vector3.Vector3
> = M.defineMapper(
  M.read(M.requiredProp('x'), M.requiredProp('y'), M.requiredProp('z')),
  ([x, y, z]) => Vector3.create(x, y, z)
);

export const mapBoundingBox3f: M.Func<
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

export const mapPlane: M.Func<vertexvis.protobuf.core.IPlane, Plane.Plane> =
  M.defineMapper(
    M.read(M.requiredProp('d'), M.mapRequiredProp('normal', mapVector3f)),
    ([constant, normal]) => Plane.create({ normal, constant })
  );
