import { vertexvis } from '@vertexvis/frame-streaming-protos';
import { BoundingBox, Dimensions } from '@vertexvis/geometry';
import { protoToDate } from '@vertexvis/stream-api';
import { Mapper as M } from '@vertexvis/utils';

import { Token } from '../token';
import {
  CrossSectioning,
  Frame,
  FrameCamera,
  FrameImage,
  FramePerspectiveCamera,
  FrameScene,
  ImageAttributesLike,
  Orientation,
} from '../types';
import { fromPbUuid } from './core';
import {
  fromPbBoundingBox3f,
  fromPbDim,
  fromPbRect,
  fromPbVector3f,
} from './geometry';
import { fromPbRGBi } from './material';
import { fromPbBytesValue } from './scalar';

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
  ImageAttributesLike
> = M.defineMapper(
  M.read(
    M.mapProp(
      'frameDimensions',
      M.compose(M.required('frameDimensions'), fromPbDim)
    ),
    M.mapProp('imageRect', M.compose(M.required('imageRect'), fromPbRect)),
    M.mapProp('scaleFactor', M.required('scaleFactor'))
  ),
  ([frameDimensions, imageRect, imageScale]) => ({
    frameDimensions,
    imageRect,
    imageScale,
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
  ImageAttributesLike
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
  ([imageAttr, image]) => new FrameImage(imageAttr, image)
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
      M.mapProp('depthBuffer', fromPbBytesValue),
      M.mapProp('featureMap', fromPbBytesValue)
    ),
    ([cIds, seq, fd, s, i, db, fm]) => new Frame(cIds, seq, fd, i, s, db, fm)
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
  {
    stencilBuffer: Uint8Array;
    depthBuffer: Uint8Array;
    imageAttributes: ImageAttributesLike;
  }
> = M.defineMapper(
  M.read(
    M.mapRequiredProp('imageAttributes', fromPbImageAttributes),
    M.requiredProp('stencilBuffer'),
    M.mapRequiredProp(
      'depthBuffer',
      M.compose(fromPbBytesValue, M.required('depthBuffer'))
    )
  ),
  ([imageAttributes, stencilBuffer, depthBuffer]) => ({
    imageAttributes,
    stencilBuffer,
    depthBuffer,
  })
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

export const fromPbToken: M.Func<vertexvis.protobuf.stream.IToken, Token> =
  M.defineMapper(
    M.read(M.requiredProp('token'), M.requiredProp('expiresIn')),
    ([token, expiresIn]) => Token.create(token, expiresIn)
  );

export const fromPbStartStreamResponse: M.Func<
  vertexvis.protobuf.stream.IStreamResponse,
  {
    streamId: string;
    sceneViewId: string;
    sessionId: string;
    worldOrientation: Orientation;
    token: Token;
  }
> = M.defineMapper(
  M.read(
    M.compose(
      M.requiredProp('startStream'),
      M.mapRequiredProp('streamId', fromPbUuid)
    ),
    M.compose(
      M.requiredProp('startStream'),
      M.mapRequiredProp('sceneViewId', fromPbUuid)
    ),
    M.compose(
      M.requiredProp('startStream'),
      M.mapRequiredProp('sessionId', fromPbUuid)
    ),
    M.compose(
      M.requiredProp('startStream'),
      M.mapRequiredProp('worldOrientation', fromPbWorldOrientation)
    ),
    M.compose(
      M.requiredProp('startStream'),
      M.mapRequiredProp('token', fromPbToken)
    )
  ),
  ([streamId, sceneViewId, sessionId, worldOrientation, token]) => ({
    streamId,
    sceneViewId,
    sessionId: sessionId,
    worldOrientation,
    token,
  })
);

export const fromPbStartStreamResponseOrThrow = M.ifInvalidThrow(
  fromPbStartStreamResponse
);

export const fromPbReconnectResponse: M.Func<
  vertexvis.protobuf.stream.IStreamResponse,
  { token: Token }
> = M.defineMapper(
  M.read(
    M.compose(
      M.requiredProp('reconnect'),
      M.mapRequiredProp('token', fromPbToken)
    )
  ),
  ([token]) => ({ token })
);

export const fromPbReconnectResponseOrThrow = M.ifInvalidThrow(
  fromPbReconnectResponse
);

export const fromPbRefreshTokenResponse: M.Func<
  vertexvis.protobuf.stream.IStreamResponse,
  Token
> = M.defineMapper(
  M.compose(
    M.requiredProp('refreshToken'),
    M.requiredProp('token'),
    fromPbToken
  ),
  (token) => token
);

export const fromPbRefreshTokenResponseOrThrow = M.ifInvalidThrow(
  fromPbRefreshTokenResponse
);

export const fromPbSyncTimeResponse: M.Func<
  vertexvis.protobuf.stream.IStreamResponse,
  Date
> = M.defineMapper(
  M.compose(
    M.requiredProp('syncTime'),
    M.requiredProp('replyTime'),
    M.read(M.requiredProp('seconds'), M.requiredProp('nanos'))
  ),
  ([seconds, nanos]) => protoToDate({ seconds, nanos })
);

export const fromPbSyncTimeResponseOrThrow = M.ifInvalidThrow(
  fromPbSyncTimeResponse
);
