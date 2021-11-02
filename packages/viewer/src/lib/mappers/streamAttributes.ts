import { vertexvis } from '@vertexvis/frame-streaming-protos';
import { clamp } from '@vertexvis/geometry';
import { Mapper as M } from '@vertexvis/utils';
import {
  DepthBufferFrameType,
  FeatureHighlightOptions,
  FeatureLineOptions,
  StreamAttributes,
} from '../../interfaces';
import { toPbFloatValue } from './scalar';
import { toPbRGBi } from './material';

const toPbDepthBuffers: M.Func<
  DepthBufferFrameType,
  vertexvis.protobuf.stream.IDepthBufferAttributes
> = M.defineMapper(
  (type) => {
    switch (type) {
      case 'all':
        return {
          enabled: { value: true },
          frameType: vertexvis.protobuf.stream.FrameType.FRAME_TYPE_ALL,
        };
      case 'final':
        return {
          enabled: { value: true },
          frameType: vertexvis.protobuf.stream.FrameType.FRAME_TYPE_FINAL,
        };
      default:
        return {
          enabled: { value: false },
          frameType: vertexvis.protobuf.stream.FrameType.FRAME_TYPE_INVALID,
        };
    }
  },
  (type) => type
);

const toPbExperimentalGhosting: M.Func<
  number | undefined,
  vertexvis.protobuf.stream.IGhostingAttributes
> = M.defineMapper(
  (opacity) => {
    const enabled = opacity != null && opacity > 0;
    return {
      enabled: { value: enabled },
      opacity: enabled ? { value: clamp(opacity ?? 0, 0, 1) } : undefined,
    };
  },
  (attr) => attr
);

const toPbFeatureLines: M.Func<
  FeatureLineOptions | undefined,
  vertexvis.protobuf.stream.IFeatureLineAttributes
> = M.defineMapper(
  M.read(
    M.ifDefined(M.getProp('width')),
    M.ifDefined(M.mapProp('color', M.ifDefined(toPbRGBi)))
  ),
  ([lineWidth, lineColor]) => ({ lineWidth, lineColor })
);

const toPbFeatureHighlight: M.Func<
  FeatureHighlightOptions | undefined,
  vertexvis.protobuf.stream.IFeatureHighlightAttributes
> = M.defineMapper(
  M.read(
    M.ifDefined(M.mapProp('highlightColor', M.ifDefined(toPbRGBi))),
    M.ifDefined(M.mapProp('occludedOpacity', toPbFloatValue)),
    M.ifDefined(M.mapProp('outline', M.ifDefined(toPbFeatureLines)))
  ),
  ([highlightColor, occludedOpacity, outline]) => ({
    highlightColor,
    occludedOpacity,
    outline,
  })
);

export const toPbStreamAttributes: M.Func<
  StreamAttributes,
  vertexvis.protobuf.stream.IStreamAttributes
> = M.defineMapper(
  M.read(
    M.mapProp('depthBuffers', toPbDepthBuffers),
    M.mapProp('experimentalGhosting', toPbExperimentalGhosting),
    M.mapProp('featureLines', toPbFeatureLines),
    M.mapProp('featureHighlighting', toPbFeatureHighlight)
  ),
  ([db, eg, fl, fh]) => ({
    depthBuffers: db,
    experimentalGhosting: eg,
    featureLines: fl,
    featureHighlighting: fh,
  })
);
