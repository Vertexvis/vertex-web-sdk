import { google, vertexvis } from '@vertexvis/frame-streaming-protos';
import { StreamAttributes as PBStreamAttributes } from '@vertexvis/stream-api';

// TODO: support other frame types
// Currently only final frames are allowed to prevent performance issues
export type DepthBufferFrameType = 'final' | 'all';

type ViewerStreamAttributeBoolValue = boolean | google.protobuf.IBoolValue;

export interface ViewerStreamAttributes {
  depthBuffers?: {
    enabled?: ViewerStreamAttributeBoolValue;
    frameType?: DepthBufferFrameType;
  };
  experimentalGhosting?: {
    enabled?: ViewerStreamAttributeBoolValue;
    opacity?: number | google.protobuf.IFloatValue;
  };
}

export const toProtoStreamAttributes = (
  attributes: ViewerStreamAttributes
): PBStreamAttributes => {
  let pbFrameType = vertexvis.protobuf.stream.FrameType.FRAME_TYPE_INVALID;

  switch (attributes.depthBuffers?.frameType) {
    case 'final':
      pbFrameType = vertexvis.protobuf.stream.FrameType.FRAME_TYPE_FINAL;
      break;
    case 'all':
      pbFrameType = vertexvis.protobuf.stream.FrameType.FRAME_TYPE_ALL;
    default:
      break;
  }

  return {
    ...attributes,
    depthBuffers: {
      enabled: boolToProto(attributes.depthBuffers?.enabled),
      frameType: pbFrameType,
    },
    experimentalGhosting: {
      enabled: boolToProto(attributes.experimentalGhosting?.enabled),
      opacity:
        typeof attributes.experimentalGhosting?.opacity === 'number'
          ? { value: attributes.experimentalGhosting?.opacity }
          : attributes.experimentalGhosting?.opacity,
    },
  };
};

const boolToProto = (
  bool?: ViewerStreamAttributeBoolValue
): google.protobuf.IBoolValue | undefined => {
  if (bool != null) {
    return typeof bool === 'boolean' ? { value: bool } : bool;
  }
};
