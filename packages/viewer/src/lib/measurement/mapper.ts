import type { MeasureResponse as PbMeasureResponse } from '@vertexvis/scene-view-protos/sceneview/protos/scene_view_api_pb';
import type {
  MeasurementResult as PbMeasurementResult,
  PlanarDistanceResult as PbPlanarDistanceResult,
  PlanarAngleResult as PbPlanarAngleResult,
  MinimumDistanceResult as PbMinimumDistanceResult,
  SurfaceAreaResult as PbSurfaceAreaResult,
  PlanePair as PbPlanePair,
} from '@vertexvis/scene-view-protos/core/protos/measurement_pb';
import { Mapper as M } from '@vertexvis/utils';
import {
  MeasurementOutcome,
  MeasurementResult,
  MinimumDistanceMeasurementResult,
  PlanarAngleMeasurementResult,
  PlanarDistanceMeasurementResult,
  SurfaceAreaMeasurementResult,
} from '../measurement/model';
import { fromPbPlane, fromPbVector3f } from '../mappers';
import { Plane } from '@vertexvis/geometry';

const mapPlanePair: M.Func<
  PbPlanePair.AsObject,
  { start: Plane.Plane; end: Plane.Plane }
> = M.defineMapper(
  M.read(
    M.mapRequiredProp('start', fromPbPlane),
    M.mapRequiredProp('end', fromPbPlane)
  ),
  ([start, end]) => ({ start, end })
);

const mapPlanarDistance: M.Func<
  PbPlanarDistanceResult.AsObject,
  PlanarDistanceMeasurementResult
> = M.defineMapper(
  M.read(
    M.getProp('distance'),
    M.mapRequiredProp(
      'planes',
      M.compose(mapPlanePair, M.requiredProp('start'))
    ),
    M.mapRequiredProp('planes', M.compose(mapPlanePair, M.requiredProp('end')))
  ),
  ([distance, plane1, plane2]) => ({
    type: 'planar-distance',
    distance,
    plane1,
    plane2,
  })
);

const mapPlanarAngle: M.Func<
  PbPlanarAngleResult.AsObject,
  PlanarAngleMeasurementResult
> = M.defineMapper(
  M.read(
    M.getProp('angleInRadians'),
    M.mapRequiredProp(
      'planes',
      M.compose(mapPlanePair, M.requiredProp('start'))
    ),
    M.mapRequiredProp('planes', M.compose(mapPlanePair, M.requiredProp('end')))
  ),
  ([angle, plane1, plane2]) => ({
    type: 'planar-angle',
    angle,
    plane1,
    plane2,
  })
);

const mapMinimumDistance: M.Func<
  PbMinimumDistanceResult.AsObject,
  MinimumDistanceMeasurementResult
> = M.defineMapper(
  M.read(
    M.getProp('distance'),
    M.mapRequiredProp('closestPoint1', fromPbVector3f),
    M.mapRequiredProp('closestPoint2', fromPbVector3f)
  ),
  ([distance, closestPoint1, closestPoint2]) => ({
    type: 'minimum-distance',
    distance,
    closestPoint1,
    closestPoint2,
  })
);

const mapSurfaceArea: M.Func<
  PbSurfaceAreaResult.AsObject,
  SurfaceAreaMeasurementResult
> = M.defineMapper(M.read(M.getProp('area')), ([area]) => ({
  type: 'surface-area',
  area,
}));

const mapPlanarDistanceFromResult: M.Func<
  PbMeasurementResult.AsObject,
  PlanarDistanceMeasurementResult | undefined | null
> = M.mapProp('planarDistance', M.ifDefined(mapPlanarDistance));

const mapPlanarAngleFromResult: M.Func<
  PbMeasurementResult.AsObject,
  PlanarAngleMeasurementResult | undefined | null
> = M.mapProp('planarAngle', M.ifDefined(mapPlanarAngle));

const mapMinimumDistanceFromResult: M.Func<
  PbMeasurementResult.AsObject,
  MinimumDistanceMeasurementResult | undefined | null
> = M.mapProp('minimumDistance', M.ifDefined(mapMinimumDistance));

const mapSurfaceAreaFromResult: M.Func<
  PbMeasurementResult.AsObject,
  SurfaceAreaMeasurementResult | undefined | null
> = M.mapProp('totalSurfaceArea', M.ifDefined(mapSurfaceArea));

const mapMeasurementResult: M.Func<
  PbMeasurementResult.AsObject,
  MeasurementResult
> = M.compose(
  M.pickFirst(
    mapPlanarDistanceFromResult,
    mapPlanarAngleFromResult,
    mapMinimumDistanceFromResult,
    mapSurfaceAreaFromResult
  ),
  M.required('Result field')
);

export const mapMeasureResponse: M.Func<
  PbMeasureResponse.AsObject,
  MeasurementOutcome
> = M.defineMapper(
  M.read(
    M.mapRequiredProp(
      'outcome',
      M.mapRequiredProp('resultsList', M.mapArray(mapMeasurementResult))
    )
  ),
  ([results]) => ({ results })
);

export const mapMeasureResponseOrThrow = M.ifInvalidThrow(mapMeasureResponse);
