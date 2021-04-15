import { google, vertexvis } from '@vertexvis/frame-streaming-protos';
import { StreamAttributes as PBStreamAttributes } from '@vertexvis/stream-api';

export type DepthBufferFrameType = 'all' | 'final' | 'transition';

interface ViewerStreamAttributes {
  depthBuffers?: {
    enabled: google.protobuf.BoolValue;
    frameType: DepthBufferFrameType;
  };
}

export type StreamAttributes = Pick<
  PBStreamAttributes,
  'experimentalGhosting'
> &
  ViewerStreamAttributes;

export const toProtoStreamAttributes = (
  attributes: StreamAttributes
): PBStreamAttributes => {
  let pbFrameType = vertexvis.protobuf.stream.FrameType.FRAME_TYPE_INVALID;

  switch (attributes.depthBuffers?.frameType) {
    case 'all':
      pbFrameType = vertexvis.protobuf.stream.FrameType.FRAME_TYPE_ALL;
      break;
    case 'transition':
      pbFrameType = vertexvis.protobuf.stream.FrameType.FRAME_TYPE_TRANSITION;
      break;
    case 'final':
      pbFrameType = vertexvis.protobuf.stream.FrameType.FRAME_TYPE_FINAL;
      break;
    default:
      break;
  }

  return {
    ...attributes,
    depthBuffers: {
      ...attributes.depthBuffers,
      frameType: pbFrameType,
    },
  };
};
