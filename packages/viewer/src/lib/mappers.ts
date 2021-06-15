import { vertexvis } from '@vertexvis/frame-streaming-protos';
import { Color, Mapper as M } from '@vertexvis/utils';
import {
  BoundingBox,
  Dimensions,
  Rectangle,
  Vector3,
} from '@vertexvis/geometry';
import {
  CrossSectioning,
  FrameCamera,
  Frame,
  FrameImage,
  FrameScene,
  FramePerspectiveCamera,
} from './types';

export function mapRGBi(): M.Func<vertexvis.protobuf.core.IRGBAi, Color.Color> {
  return M.defineMapper(
    M.read(
      M.requiredProp('r'),
      M.requiredProp('g'),
      M.requiredProp('b'),
      M.requiredProp('a')
    ),
    ([r, g, b, a]) => Color.create(r, g, b, a)
  );
}

export function mapVector3f(): M.Func<
  vertexvis.protobuf.core.IVector3f,
  Vector3.Vector3
> {
  return M.defineMapper(
    M.read(M.requiredProp('x'), M.requiredProp('y'), M.requiredProp('z')),
    ([x, y, z]) => Vector3.create(x, y, z)
  );
}

export function mapBoundingBox3f(): M.Func<
  vertexvis.protobuf.core.IBoundingBox3f,
  BoundingBox.BoundingBox
> {
  return M.defineMapper(
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
}

export function mapDim(): M.Func<
  vertexvis.protobuf.stream.IDimensions,
  Dimensions.Dimensions
> {
  return M.defineMapper(
    M.read(M.requiredProp('width'), M.requiredProp('height')),
    ([width, height]) => Dimensions.create(width, height)
  );
}

export function mapRect(): M.Func<
  vertexvis.protobuf.stream.IRectangle,
  Rectangle.Rectangle
> {
  return M.defineMapper(
    M.read(
      M.requiredProp('x'),
      M.requiredProp('y'),
      M.requiredProp('width'),
      M.requiredProp('height')
    ),
    ([x, y, width, height]) => Rectangle.create(x, y, width, height)
  );
}

export function mapCamera(): M.Func<
  vertexvis.protobuf.stream.ICamera,
  FrameCamera.FrameCamera
> {
  return M.defineMapper(
    M.read(
      M.mapProp('position', M.compose(M.required('position'), mapVector3f())),
      M.mapProp('lookAt', M.compose(M.required('lookAt'), mapVector3f())),
      M.mapProp('up', M.compose(M.required('up'), mapVector3f()))
    ),
    ([position, lookAt, up]) => ({ position, lookAt, up })
  );
}

export const mapSectionPlane: M.Func<
  vertexvis.protobuf.stream.ISectionPlane,
  CrossSectioning.SectionPlane
> = M.defineMapper(
  M.read(
    M.mapProp('normal', M.compose(M.required('normal'), mapVector3f())),
    M.requiredProp('offset')
  ),
  ([normal, offset]) => ({ normal, offset })
);

const mapImageAttributes: M.Func<
  vertexvis.protobuf.stream.IImageAttributes,
  {
    frameDimensions: Dimensions.Dimensions;
    imageRect: Rectangle.Rectangle;
    scaleFactor: number;
  }
> = M.defineMapper(
  M.read(
    M.mapProp(
      'frameDimensions',
      M.compose(M.required('frameDimensions'), mapDim())
    ),
    M.mapProp('imageRect', M.compose(M.required('imageRect'), mapRect())),
    M.mapProp('scaleFactor', M.required('scaleFactor'))
  ),
  ([frameDimensions, imageRect, scaleFactor]) => ({
    frameDimensions,
    imageRect,
    scaleFactor,
  })
);

export const mapCrossSectioning: M.Func<
  vertexvis.protobuf.stream.ICrossSectioning,
  CrossSectioning.CrossSectioning
> = M.defineMapper(
  M.read(
    M.mapProp(
      'sectionPlanes',
      M.compose(M.required('sectionPlanes'), M.mapArray(mapSectionPlane))
    ),
    M.mapProp('highlightColor', M.ifDefined(mapRGBi()))
  ),
  ([sectionPlanes, highlightColor]) =>
    CrossSectioning.create({
      sectionPlanes,
      highlightColor: highlightColor || undefined,
    })
);

const mapFrameImageAttributes: M.Func<
  vertexvis.protobuf.stream.IDrawFramePayload,
  {
    frameDimensions: Dimensions.Dimensions;
    imageRect: Rectangle.Rectangle;
    scaleFactor: number;
  }
> = M.defineMapper(
  M.read(
    M.mapProp(
      'imageAttributes',
      M.compose(M.required('imageAttributes'), mapImageAttributes)
    )
  ),
  ([imageAttr]) => imageAttr
);

const mapFrameImage: M.Func<
  vertexvis.protobuf.stream.IDrawFramePayload,
  FrameImage
> = M.defineMapper(
  M.read(mapFrameImageAttributes, M.mapProp('image', M.required('image'))),
  ([imageAttr, image]) =>
    new FrameImage(
      imageAttr.frameDimensions,
      imageAttr.imageRect,
      imageAttr.scaleFactor,
      image
    )
);

const mapSceneAttributes: M.Func<
  vertexvis.protobuf.stream.ISceneAttributes,
  {
    camera: FrameCamera.FrameCamera;
    boundingBox: BoundingBox.BoundingBox;
    crossSectioning: CrossSectioning.CrossSectioning;
  }
> = M.defineMapper(
  M.read(
    M.mapProp('camera', M.compose(M.required('camera'), mapCamera())),
    M.mapProp(
      'visibleBoundingBox',
      M.compose(M.required('visibleBoundingBox'), mapBoundingBox3f())
    ),
    M.mapProp(
      'crossSectioning',
      M.compose(M.required('crossSectioning'), mapCrossSectioning)
    )
  ),
  ([camera, boundingBox, crossSectioning]) => ({
    camera,
    boundingBox,
    crossSectioning,
  })
);

const mapFrameSceneAttributes: M.Func<
  vertexvis.protobuf.stream.IDrawFramePayload,
  {
    camera: FrameCamera.FrameCamera;
    boundingBox: BoundingBox.BoundingBox;
    crossSectioning: CrossSectioning.CrossSectioning;
  }
> = M.defineMapper(
  M.read(
    M.mapProp(
      'sceneAttributes',
      M.compose(M.required('sceneAttributes'), mapSceneAttributes)
    )
  ),
  ([sceneAttr]) => sceneAttr
);

const mapFrameCamera: M.Func<
  vertexvis.protobuf.stream.IDrawFramePayload,
  FramePerspectiveCamera
> = M.defineMapper(
  M.read(mapFrameSceneAttributes, mapFrameImageAttributes),
  ([sceneAttr, imageAttr]) =>
    FramePerspectiveCamera.fromBoundingBox(
      sceneAttr.camera,
      sceneAttr.boundingBox,
      Dimensions.aspectRatio(imageAttr.frameDimensions)
    )
);

const mapFrameScene: M.Func<
  vertexvis.protobuf.stream.IDrawFramePayload,
  FrameScene
> = M.defineMapper(
  M.read(mapFrameSceneAttributes, mapFrameCamera),
  ([sceneAttr, camera]) =>
    new FrameScene(camera, sceneAttr.boundingBox, sceneAttr.crossSectioning)
);

export const mapFrame: M.Func<
  vertexvis.protobuf.stream.IDrawFramePayload,
  Frame
> = M.defineMapper(
  M.read(
    M.mapProp('frameCorrelationIds', (ids) => (ids != null ? ids : [])),
    M.requiredProp('sequenceNumber'),
    M.compose(mapFrameImageAttributes, M.getProp('frameDimensions')),
    mapFrameScene,
    mapFrameImage,
    M.getProp('depthBuffer')
  ),
  ([correlationIds, seqNum, frameDimensions, scene, image, depthBuffer]) => {
    return new Frame(
      correlationIds,
      seqNum,
      frameDimensions,
      image,
      scene,
      depthBuffer?.value || undefined
    );
  }
);
