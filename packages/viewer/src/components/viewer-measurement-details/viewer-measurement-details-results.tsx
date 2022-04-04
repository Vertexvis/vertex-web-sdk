// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Fragment, FunctionalComponent, h } from '@stencil/core';
import { Vector3 } from '@vertexvis/geometry';

import { Formatter } from '../../lib/formatter';
import {
  MeasurementOverlay,
  MeasurementOverlayManager,
  MeasurementResult,
  MinimumDistanceMeasurementResult,
  PlanarAngleMeasurementResult,
  PlanarDistanceMeasurementResult,
  SurfaceAreaMeasurementResult,
} from '../../lib/measurement';
import { MeasurementDetailsEntry } from './viewer-measurement-details-entry';

interface MeasurementResultEntryProps<R extends MeasurementResult> {
  result: R;
  overlays?: MeasurementOverlayManager;
  formatter: Formatter<number>;
  onShowOverlay: (overlay: MeasurementOverlay | undefined) => void;
  onHideOverlay: () => void;
}

export const MinimumDistanceResultEntry: FunctionalComponent<
  MeasurementResultEntryProps<MinimumDistanceMeasurementResult>
> = ({ result, formatter, overlays, onShowOverlay, onHideOverlay }) => {
  const v = Vector3.subtract(result.point1, result.point2);

  return (
    <Fragment>
      <MeasurementDetailsEntry
        label="Dist"
        onMouseEnter={() => onShowOverlay(overlays?.addLineFromResult(result))}
        onMouseLeave={onHideOverlay}
      >
        {formatter(result.distance)}
      </MeasurementDetailsEntry>
      <MeasurementDetailsEntry
        label="X"
        onMouseEnter={() =>
          onShowOverlay(overlays?.addDistanceVectorFromResult(result))
        }
        onMouseLeave={onHideOverlay}
      >
        {formatter(v.x)}
      </MeasurementDetailsEntry>
      <MeasurementDetailsEntry
        label="Y"
        onMouseEnter={() =>
          onShowOverlay(overlays?.addDistanceVectorFromResult(result))
        }
        onMouseLeave={onHideOverlay}
      >
        {formatter(v.y)}
      </MeasurementDetailsEntry>
      <MeasurementDetailsEntry
        label="Z"
        onMouseEnter={() =>
          onShowOverlay(overlays?.addDistanceVectorFromResult(result))
        }
        onMouseLeave={onHideOverlay}
      >
        {formatter(v.z)}
      </MeasurementDetailsEntry>
    </Fragment>
  );
};

export const PlanarAngleResultEntry: FunctionalComponent<
  MeasurementResultEntryProps<PlanarAngleMeasurementResult>
> = ({ result, formatter }) => {
  return (
    <MeasurementDetailsEntry label="Angle">
      {formatter(result.angle)}
    </MeasurementDetailsEntry>
  );
};

export const PlanarDistanceResultEntry: FunctionalComponent<
  MeasurementResultEntryProps<PlanarDistanceMeasurementResult>
> = ({ result, formatter }) => {
  return (
    <MeasurementDetailsEntry label="Parallel Dist">
      {formatter(result.distance)}
    </MeasurementDetailsEntry>
  );
};

export const SurfaceAreaResultEntry: FunctionalComponent<
  MeasurementResultEntryProps<SurfaceAreaMeasurementResult>
> = ({ result, formatter }) => {
  return (
    <MeasurementDetailsEntry label="Area">
      {formatter(result.area)}
    </MeasurementDetailsEntry>
  );
};
