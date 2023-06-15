import { vertexvis } from '@vertexvis/frame-streaming-protos';
import { clamp } from '@vertexvis/geometry';
import { Mapper as M } from '@vertexvis/utils';

import {
  FeatureHighlightOptions,
  FeatureLineOptions,
  FrameType,
  SelectionHighlightingOptions,
  StreamAttributes,
} from '../../interfaces';
import { toPbRGBi } from './material';
import { toPbFloatValue } from './scalar';

const toPbFrameType: M.Func<
  FrameType,
  | vertexvis.protobuf.stream.IDepthBufferAttributes
  | vertexvis.protobuf.stream.IFeatureMapAttributes
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

const toPbPhantom: M.Func<
  number | undefined,
  vertexvis.protobuf.stream.IPhantomAttributes
> = M.defineMapper(
  (opacity) => {
    return {
      opacity: { value: clamp(opacity ?? 0, 0, 1) },
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

const toPbSelectionHighlighting: M.Func<
  SelectionHighlightingOptions | undefined,
  vertexvis.protobuf.stream.ISelectionHighlightAttributes | undefined
> = M.defineMapper(
  M.read(
    M.ifDefined(M.mapProp('color', M.ifDefined(toPbRGBi))),
    M.ifDefined(M.mapProp('opacity', toPbFloatValue)),
    M.ifDefined(M.getProp('lineWidth'))
  ),
  ([color, opacity, lineWidth]) => {
    if (color || opacity || lineWidth) {
      return {
        color,
        opacity,
        lineWidth,
      };
    } else return undefined;
  }
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

const toPbNoDefaultLights: M.Func<boolean | undefined, boolean> =
  M.defineMapper(
    (noDefaultLights) => !!noDefaultLights,
    (attr) => attr
  );

const toPbExperimentalRenderingOptions: M.Func<string | undefined, string> =
  M.defineMapper(
    (experimentalRenderingOptions) => experimentalRenderingOptions ?? '',
    (attr) => attr
  );

export const toPbStreamAttributes: M.Func<
  StreamAttributes,
  vertexvis.protobuf.stream.IStreamAttributes
> = M.defineMapper(
  M.read(
    M.mapProp('depthBuffers', toPbFrameType),
    M.mapProp('experimentalGhosting', toPbExperimentalGhosting),
    M.mapProp('phantom', toPbPhantom),
    M.mapProp('noDefaultLights', toPbNoDefaultLights),
    M.mapProp('featureLines', toPbFeatureLines),
    M.mapProp('featureHighlighting', toPbFeatureHighlight),
    M.mapProp('featureMaps', toPbFrameType),
    M.mapProp('experimentalRenderingOptions', toPbExperimentalRenderingOptions),
    M.mapProp('selectionHighlighting', toPbSelectionHighlighting)
  ),
  ([db, eg, pi, ndl, fl, fh, fm, ero, hs]) => {
    const value = {
      depthBuffers: db,
      experimentalGhosting: eg,
      phantomItems: pi,
      noDefaultLights: ndl,
      featureLines: fl,
      featureHighlighting: fh,
      featureMaps: fm,
      experimentalRenderingOptions: ero,
      selectionHighlighting: hs,
    };

    return value;
  }
);
