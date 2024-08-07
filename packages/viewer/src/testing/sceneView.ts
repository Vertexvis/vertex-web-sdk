import {
  Plane,
  Vector3f,
} from '@vertexvis/scene-view-protos/core/protos/geometry_pb';
import {
  MeasurementOutcome,
  MeasurementResult,
  MinimumDistanceResult,
  PlanarAngleResult,
  PlanarDistanceResult,
  PlanePair,
  SurfaceAreaResult,
} from '@vertexvis/scene-view-protos/core/protos/measurement_pb';
import { Uuid2l } from '@vertexvis/scene-view-protos/core/protos/uuid_pb';
import { MeasureResponse } from '@vertexvis/scene-view-protos/sceneview/protos/scene_view_api_pb';
import { toProtoTimestamp } from '@vertexvis/stream-api';
import { UUID } from '@vertexvis/utils';
import { Timestamp } from 'google-protobuf/google/protobuf/timestamp_pb';

import { random } from './random';

export function makeMeasureResponse(
  ...result: MeasurementResult[]
): MeasureResponse {
  const response = new MeasureResponse();
  const outcome = new MeasurementOutcome();
  outcome.setResultsList(result);
  response.setOutcome(outcome);
  return response;
}

export function makePlanarDistanceResult(): MeasurementResult {
  const result = new MeasurementResult();
  const distance = new PlanarDistanceResult();
  distance.setDistance(random.floating());
  distance.setPlanes(makePlanes());
  result.setPlanarDistance(distance);
  return result;
}

export function makePlanarAngleResult(): MeasurementResult {
  const result = new MeasurementResult();
  const angle = new PlanarAngleResult();
  angle.setAngleInRadians(random.floating());
  angle.setPlanes(makePlanes());
  result.setPlanarAngle(angle);
  return result;
}

export function makeMinimumDistanceResult(): MeasurementResult {
  const result = new MeasurementResult();
  const distance = new MinimumDistanceResult();
  distance.setDistance(random.floating());
  distance.setClosestPoint1(makeVector3());
  distance.setClosestPoint2(makeVector3());
  result.setMinimumDistance(distance);
  return result;
}

export function makeSurfaceAreaResult(): MeasurementResult {
  const result = new MeasurementResult();
  const area = new SurfaceAreaResult();
  area.setArea(random.floating());
  result.setTotalSurfaceArea(area);
  return result;
}

export function makePlanes(): PlanePair {
  const plane1 = new Plane();
  plane1.setD(random.floating());
  plane1.setNormal(makeVector3());

  const plane2 = new Plane();
  plane2.setD(random.floating());
  plane2.setNormal(makeVector3());

  const planes = new PlanePair();
  planes.setStart(plane1);
  planes.setEnd(plane2);
  return planes;
}

export function makeVector3(): Vector3f {
  const vector = new Vector3f();
  vector.setX(random.floating());
  vector.setY(random.floating());
  vector.setZ(random.floating());
  return vector;
}

export function makeUuid2l(id: UUID.UUID = UUID.create()): Uuid2l {
  const msbLsb = UUID.toMsbLsb(id);
  const pb = new Uuid2l();
  pb.setMsb(msbLsb.msb);
  pb.setLsb(msbLsb.lsb);
  return pb;
}

export function makeTimestamp(date: Date = new Date()): Timestamp {
  const timestamp = toProtoTimestamp(date);
  const res = new Timestamp();

  if (typeof timestamp.seconds === 'number') {
    res.setSeconds(timestamp.seconds);
  } else {
    res.setSeconds(timestamp.seconds.toNumber());
  }

  res.setNanos(timestamp.nanos);
  return res;
}
