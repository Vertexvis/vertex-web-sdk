import { google, vertexvis } from '@vertexvis/frame-streaming-protos';
import { StreamAttributes as PBStreamAttributes } from '@vertexvis/stream-api';

// TODO: support other frame types
// Currently only final frames are allowed to prevent performance issues
export type DepthBufferFrameType = 'final';

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
  let pbFrameType = vertexvis.protobuf.stream.FrameType.FRAME_TYPE_ALL;

  switch (attributes.depthBuffers?.frameType) {
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
