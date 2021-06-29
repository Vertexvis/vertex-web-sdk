// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { FunctionalComponent, h } from '@stencil/core';
import { Point } from '@vertexvis/geometry';
import { cssTransformCenterAt } from '../../lib/dom';

export interface DistanceMeasurementProps {
  startPt?: Point.Point;
  endPt?: Point.Point;
  labelPt?: Point.Point;
  distance?: string;
  onStartAnchorMouseDown?: (event: MouseEvent) => void;
  onEndAnchorMouseDown?: (event: MouseEvent) => void;
}

export const DistanceMeasurement: FunctionalComponent<DistanceMeasurementProps> = ({
  startPt,
  endPt,
  labelPt,
  distance,
  onStartAnchorMouseDown,
  onEndAnchorMouseDown,
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
          onMouseDown={onStartAnchorMouseDown}
        >
          <slot name="start">
            <div class="anchor"></div>
          </slot>
        </div>
      )}

      {endPt != null && (
        <div
          id="end-anchor"
          class="anchor-container"
          style={{ transform: cssTransformCenterAt(endPt) }}
          onMouseDown={onEndAnchorMouseDown}
        >
          <slot name="end">
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
