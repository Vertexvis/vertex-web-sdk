// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { FunctionalComponent, h } from '@stencil/core';
import { Angle, Point } from '@vertexvis/geometry';
import { cssTransformCenterAt } from '../../lib/dom';

export interface DistanceMeasurementRendererProps {
  startPt?: Point.Point;
  endPt?: Point.Point;
  centerPt?: Point.Point;
  distance?: string;
  anchorLabelOffset?: number;
  lineCapLength?: number;
  linePointerEvents?: string;
  onStartAnchorPointerDown?: (event: PointerEvent) => void;
  onEndAnchorPointerDown?: (event: PointerEvent) => void;
}

export const DistanceMeasurementRenderer: FunctionalComponent<DistanceMeasurementRendererProps> = ({
  startPt,
  endPt,
  centerPt,
  distance,
  anchorLabelOffset,
  lineCapLength,
  linePointerEvents,
  onStartAnchorPointerDown,
  onEndAnchorPointerDown,
}) => {
  const angle =
    startPt != null && endPt != null
      ? Angle.fromPoints(startPt, endPt)
      : undefined;

  const startLabelPt =
    angle != null && startPt != null && anchorLabelOffset != null
      ? Point.add(startPt, Point.polar(-anchorLabelOffset, angle))
      : undefined;

  const endLabelPt =
    angle != null && endPt != null && anchorLabelOffset != null
      ? Point.add(endPt, Point.polar(anchorLabelOffset, angle))
      : undefined;

  return (
    <div>
      {startPt != null && endPt != null && (
        <vertex-viewer-measurement-line
          class="line"
          start={startPt}
          end={endPt}
          capLength={lineCapLength}
          pointerEvents={linePointerEvents}
        />
      )}

      {startPt != null && (
        <div
          id="start-anchor"
          class="anchor anchor-start"
          style={{ transform: cssTransformCenterAt(startPt) }}
          onPointerDown={onStartAnchorPointerDown}
        >
          <slot name="start-anchor">
            <div class="anchor-placeholder"></div>
          </slot>
        </div>
      )}

      {startLabelPt && (
        <div
          class="anchor-label anchor-label-start"
          style={{ transform: cssTransformCenterAt(startLabelPt) }}
        >
          <slot name="start-label" />
        </div>
      )}

      {endPt != null && (
        <div
          id="end-anchor"
          class="anchor anchor-end"
          style={{ transform: cssTransformCenterAt(endPt) }}
          onPointerDown={onEndAnchorPointerDown}
        >
          <slot name="end-anchor">
            <div class="anchor-placeholder"></div>
          </slot>
        </div>
      )}

      {endLabelPt && (
        <div
          class="anchor-label anchor-label-end"
          style={{ transform: cssTransformCenterAt(endLabelPt) }}
        >
          <slot name="end-label" />
        </div>
      )}

      {centerPt != null && (
        <div
          id="label"
          class="distance-label"
          style={{ transform: cssTransformCenterAt(centerPt) }}
        >
          {distance}
        </div>
      )}
    </div>
  );
};
