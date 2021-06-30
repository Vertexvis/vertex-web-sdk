// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { FunctionalComponent, h } from '@stencil/core';
import { Point } from '@vertexvis/geometry';
import { cssTransformCenterAt } from '../../lib/dom';

export interface DistanceMeasurementProps {
  startPt?: Point.Point;
  endPt?: Point.Point;
  labelPt?: Point.Point;
  distance?: string;
  onStartAnchorPointerDown?: (event: PointerEvent) => void;
  onEndAnchorPointerDown?: (event: PointerEvent) => void;
}

export const DistanceMeasurement: FunctionalComponent<DistanceMeasurementProps> = ({
  startPt,
  endPt,
  labelPt,
  distance,
  onStartAnchorPointerDown,
  onEndAnchorPointerDown,
}) => {
  return (
    <div>
      {startPt != null && endPt != null && (
        <svg class="line">
          <line x1={startPt.x} y1={startPt.y} x2={endPt.x} y2={endPt.y}></line>
        </svg>
      )}

      {startPt != null && (
        <div
          id="start-anchor"
          class="anchor-container"
          style={{ transform: cssTransformCenterAt(startPt) }}
          onPointerDown={onStartAnchorPointerDown}
        >
          <slot name="start-anchor">
            <div class="anchor"></div>
          </slot>
        </div>
      )}

      {endPt != null && (
        <div
          id="end-anchor"
          class="anchor-container"
          style={{ transform: cssTransformCenterAt(endPt) }}
          onPointerDown={onEndAnchorPointerDown}
        >
          <slot name="end-anchor">
            <div class="anchor"></div>
          </slot>
        </div>
      )}

      {labelPt != null && (
        <div
          id="label"
          class="distance-label"
          style={{ transform: cssTransformCenterAt(labelPt) }}
        >
          {distance}
        </div>
      )}
    </div>
  );
};
