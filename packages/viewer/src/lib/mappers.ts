import { vertexvis } from '@vertexvis/frame-streaming-protos';
import { Object } from 'ts-toolbelt';
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
  Orientation,
} from './types';

export const mapRGBi: M.Func<vertexvis.protobuf.core.IRGBi, Color.Color> =
  M.defineMapper(
    M.read(M.requiredProp('r'), M.requiredProp('g'), M.requiredProp('b')),
    ([r, g, b]) => Color.create(r, g, b)
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

export const mapCamera: M.Func<
  vertexvis.protobuf.stream.ICamera,
  FrameCamera.FrameCamera
> = M.defineMapper(
  M.read(
    M.mapProp('position', M.compose(M.required('position'), mapVector3f)),
    M.mapProp('lookAt', M.compose(M.required('lookAt'), mapVector3f)),
    M.mapProp('up', M.compose(M.required('up'), mapVector3f))
  ),
  ([position, lookAt, up]) => ({ position, lookAt, up })
);

export const mapSectionPlane: M.Func<
  vertexvis.protobuf.stream.ISectionPlane,
  CrossSectioning.SectionPlane
> = M.defineMapper(
  M.read(
    M.mapProp('normal', M.compose(M.required('normal'), mapVector3f)),
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
      M.compose(M.required('frameDimensions'), mapDim)
    ),
    M.mapProp('imageRect', M.compose(M.required('imageRect'), mapRect)),
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
    M.mapProp('highlightColor', M.ifDefined(mapRGBi))
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
    hasChanged: boolean;
  }
> = M.defineMapper(
  M.read(
    M.mapProp('camera', M.compose(M.required('camera'), mapCamera)),
    M.mapProp(
      'visibleBoundingBox',
      M.compose(M.required('visibleBoundingBox'), mapBoundingBox3f)
    ),
    M.mapProp(
      'crossSectioning',
      M.compose(M.required('crossSectioning'), mapCrossSectioning)
    ),
    M.requiredProp('hasChanged')
  ),
  ([camera, boundingBox, crossSectioning, hasChanged]) => ({
    camera,
    boundingBox,
    crossSectioning,
    hasChanged,
  })
);

const mapFrameSceneAttributes: M.Func<
  vertexvis.protobuf.stream.IDrawFramePayload,
  {
    camera: FrameCamera.FrameCamera;
    boundingBox: BoundingBox.BoundingBox;
    crossSectioning: CrossSectioning.CrossSectioning;
    hasChanged: boolean;
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

function mapFrameScene(
  worldOrientation: Orientation
): M.Func<vertexvis.protobuf.stream.IDrawFramePayload, FrameScene> {
  return M.defineMapper(
    M.read(mapFrameSceneAttributes, mapFrameCamera),
    ([sceneAttr, camera]) =>
      new FrameScene(
        camera,
        sceneAttr.boundingBox,
        sceneAttr.crossSectioning,
        worldOrientation,
        sceneAttr.hasChanged
      )
  );
}

export function mapFrame(
  worldOrientation: Orientation
): M.Func<vertexvis.protobuf.stream.IDrawFramePayload, Frame> {
  return M.defineMapper(
    M.read(
      M.mapProp('frameCorrelationIds', (ids) => (ids != null ? ids : [])),
      M.requiredProp('sequenceNumber'),
      M.compose(mapFrameImageAttributes, M.getProp('frameDimensions')),
      mapFrameScene(worldOrientation),
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
}

export type FrameDecoder = M.ThrowIfInvalidFunc<
  vertexvis.protobuf.stream.IDrawFramePayload,
  Frame
>;

export function mapFrameOrThrow(worldOrientation: Orientation): FrameDecoder {
  return M.ifInvalidThrow(mapFrame(worldOrientation));
}

export const mapWorldOrientation: M.Func<
  vertexvis.protobuf.stream.IOrientation | null | undefined,
  Orientation
> = M.defineMapper(
  M.compose(
    M.required('orientation'),
    M.read(
      M.mapProp('up', M.compose(M.required('up'), mapVector3f)),
      M.mapProp('front', M.compose(M.required('front'), mapVector3f))
    )
  ),
  ([up, front]) => new Orientation(up, front)
);

export const mapWorldOrientationOrThrow: M.ThrowIfInvalidFunc<
  vertexvis.protobuf.stream.IOrientation | null | undefined,
  Orientation
> = M.ifInvalidThrow(mapWorldOrientation);

const mapStencilBufferResult: M.Func<
  vertexvis.protobuf.stream.IGetStencilBufferResult,
  Object.Compulsory<
    vertexvis.protobuf.stream.IGetStencilBufferResult,
    keyof vertexvis.protobuf.stream.IGetStencilBufferResult,
    'deep'
  >
> = M.defineMapper(
  M.read(
    M.mapRequiredProp('imageAttributes', mapImageAttributes),
    M.requiredProp('stencilBuffer')
  ),
  ([imageAttributes, stencilBuffer]) => ({ imageAttributes, stencilBuffer })
);

export const mapStencilBuffer = mapStreamResponse(
  'stencilBuffer',
  mapStencilBufferResult
);

export const mapStencilBufferOrThrow = M.ifInvalidThrow(mapStencilBuffer);

function mapStreamResponse<
  P extends keyof vertexvis.protobuf.stream.IStreamResponse,
  R
>(
  prop: P,
  mapper: M.Func<NonNullable<vertexvis.protobuf.stream.IStreamResponse[P]>, R>
): M.Func<vertexvis.protobuf.stream.IStreamResponse, R> {
  return M.mapRequiredProp(prop, mapper);
}
