import { vertexvis } from '@vertexvis/frame-streaming-protos';
import { Object } from 'ts-toolbelt';
import { Mapper as M } from '@vertexvis/utils';
import { BoundingBox, Dimensions, Rectangle } from '@vertexvis/geometry';
import {
  CrossSectioning,
  FrameCamera,
  Frame,
  FrameImage,
  FrameScene,
  FramePerspectiveCamera,
  Orientation,
} from '../types';
import { fromPbRGBi } from './material';
import {
  fromPbVector3f,
  fromPbBoundingBox3f,
  fromPbDim,
  fromPbRect,
} from './geometry';

export const fromPbCamera: M.Func<
  vertexvis.protobuf.stream.ICamera,
  FrameCamera.FrameCamera
> = M.defineMapper(
  M.read(
    M.mapProp('position', M.compose(M.required('position'), fromPbVector3f)),
    M.mapProp('lookAt', M.compose(M.required('lookAt'), fromPbVector3f)),
    M.mapProp('up', M.compose(M.required('up'), fromPbVector3f))
  ),
  ([position, lookAt, up]) => ({ position, lookAt, up })
);

export const fromPbSectionPlane: M.Func<
  vertexvis.protobuf.stream.ISectionPlane,
  CrossSectioning.SectionPlane
> = M.defineMapper(
  M.read(
    M.mapProp('normal', M.compose(M.required('normal'), fromPbVector3f)),
    M.requiredProp('offset')
  ),
  ([normal, offset]) => ({ normal, offset })
);

const fromPbImageAttributes: M.Func<
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
      M.compose(M.required('frameDimensions'), fromPbDim)
    ),
    M.mapProp('imageRect', M.compose(M.required('imageRect'), fromPbRect)),
    M.mapProp('scaleFactor', M.required('scaleFactor'))
  ),
  ([frameDimensions, imageRect, scaleFactor]) => ({
    frameDimensions,
    imageRect,
    scaleFactor,
  })
);

export const fromPbCrossSectioning: M.Func<
  vertexvis.protobuf.stream.ICrossSectioning,
  CrossSectioning.CrossSectioning
> = M.defineMapper(
  M.read(
    M.mapProp(
      'sectionPlanes',
      M.compose(M.required('sectionPlanes'), M.mapArray(fromPbSectionPlane))
    ),
    M.mapProp('highlightColor', M.ifDefined(fromPbRGBi))
  ),
  ([sectionPlanes, highlightColor]) =>
    CrossSectioning.create({
      sectionPlanes,
      highlightColor: highlightColor || undefined,
    })
);

const fromPbFrameImageAttributes: M.Func<
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
      M.compose(M.required('imageAttributes'), fromPbImageAttributes)
    )
  ),
  ([imageAttr]) => imageAttr
);

const fromPbFrameImage: M.Func<
  vertexvis.protobuf.stream.IDrawFramePayload,
  FrameImage
> = M.defineMapper(
  M.read(fromPbFrameImageAttributes, M.mapProp('image', M.required('image'))),
  ([imageAttr, image]) =>
    new FrameImage(
      imageAttr.frameDimensions,
      imageAttr.imageRect,
      imageAttr.scaleFactor,
      image
    )
);

const fromPbSceneAttributes: M.Func<
  vertexvis.protobuf.stream.ISceneAttributes,
  {
    camera: FrameCamera.FrameCamera;
    boundingBox: BoundingBox.BoundingBox;
    crossSectioning: CrossSectioning.CrossSectioning;
    hasChanged: boolean;
  }
> = M.defineMapper(
  M.read(
    M.mapProp('camera', M.compose(M.required('camera'), fromPbCamera)),
    M.mapProp(
      'visibleBoundingBox',
      M.compose(M.required('visibleBoundingBox'), fromPbBoundingBox3f)
    ),
    M.mapProp(
      'crossSectioning',
      M.compose(M.required('crossSectioning'), fromPbCrossSectioning)
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

const fromPbFrameSceneAttributes: M.Func<
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
      M.compose(M.required('sceneAttributes'), fromPbSceneAttributes)
    )
  ),
  ([sceneAttr]) => sceneAttr
);

const fromPbFrameCamera: M.Func<
  vertexvis.protobuf.stream.IDrawFramePayload,
  FramePerspectiveCamera
> = M.defineMapper(
  M.read(fromPbFrameSceneAttributes, fromPbFrameImageAttributes),
  ([sceneAttr, imageAttr]) =>
    FramePerspectiveCamera.fromBoundingBox(
      sceneAttr.camera,
      sceneAttr.boundingBox,
      Dimensions.aspectRatio(imageAttr.frameDimensions)
    )
);

function fromPbFrameScene(
  worldOrientation: Orientation
): M.Func<vertexvis.protobuf.stream.IDrawFramePayload, FrameScene> {
  return M.defineMapper(
    M.read(fromPbFrameSceneAttributes, fromPbFrameCamera),
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

export function fromPbFrame(
  worldOrientation: Orientation
): M.Func<vertexvis.protobuf.stream.IDrawFramePayload, Frame> {
  return M.defineMapper(
    M.read(
      M.mapProp('frameCorrelationIds', (ids) => (ids != null ? ids : [])),
      M.requiredProp('sequenceNumber'),
      M.compose(fromPbFrameImageAttributes, M.getProp('frameDimensions')),
      fromPbFrameScene(worldOrientation),
      fromPbFrameImage,
      M.getProp('depthBuffer'),
      M.getProp('featureMap')
    ),
    ([cIds, seq, fd, s, i, db, fm]) => {
      return new Frame(
        cIds,
        seq,
        fd,
        i,
        s,
        db?.value || undefined,
        fm?.value || undefined
      );
    }
  );
}

export type FrameDecoder = M.ThrowIfInvalidFunc<
  vertexvis.protobuf.stream.IDrawFramePayload,
  Frame
>;

export function fromPbFrameOrThrow(
  worldOrientation: Orientation
): FrameDecoder {
  return M.ifInvalidThrow(fromPbFrame(worldOrientation));
}

export const fromPbWorldOrientation: M.Func<
  vertexvis.protobuf.stream.IOrientation | null | undefined,
  Orientation
> = M.defineMapper(
  M.compose(
    M.required('orientation'),
    M.read(
      M.mapProp('up', M.compose(M.required('up'), fromPbVector3f)),
      M.mapProp('front', M.compose(M.required('front'), fromPbVector3f))
    )
  ),
  ([up, front]) => new Orientation(up, front)
);

export const fromPbWorldOrientationOrThrow: M.ThrowIfInvalidFunc<
  vertexvis.protobuf.stream.IOrientation | null | undefined,
  Orientation
> = M.ifInvalidThrow(fromPbWorldOrientation);

const fromPbStencilBufferResult: M.Func<
  vertexvis.protobuf.stream.IGetStencilBufferResult,
  Object.Compulsory<
    vertexvis.protobuf.stream.IGetStencilBufferResult,
    keyof vertexvis.protobuf.stream.IGetStencilBufferResult,
    'deep'
  >
> = M.defineMapper(
  M.read(
    M.mapRequiredProp('imageAttributes', fromPbImageAttributes),
    M.requiredProp('stencilBuffer')
  ),
  ([imageAttributes, stencilBuffer]) => ({ imageAttributes, stencilBuffer })
);

export const fromPbStencilBuffer = fromPbStreamResponse(
  'stencilBuffer',
  fromPbStencilBufferResult
);

export const fromPbStencilBufferOrThrow = M.ifInvalidThrow(fromPbStencilBuffer);

function fromPbStreamResponse<
  P extends keyof vertexvis.protobuf.stream.IStreamResponse,
  R
>(
  prop: P,
  mapper: M.Func<NonNullable<vertexvis.protobuf.stream.IStreamResponse[P]>, R>
): M.Func<vertexvis.protobuf.stream.IStreamResponse, R> {
  return M.mapRequiredProp(prop, mapper);
}
