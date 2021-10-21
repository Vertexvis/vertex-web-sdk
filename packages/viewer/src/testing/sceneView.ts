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
} from '@vertexvis/scene-view-protos/core/protos/measurement_pb';
import { MeasureResponse } from '@vertexvis/scene-view-protos/sceneview/protos/scene_view_api_pb';
import { random } from './random';

export function createMeasureResponse(
  ...result: MeasurementResult[]
): MeasureResponse {
  const response = new MeasureResponse();
  const outcome = new MeasurementOutcome();
  outcome.setResultsList(result);
  response.setOutcome(outcome);
  return response;
}

export function createPlanarDistanceResult(): MeasurementResult {
  const result = new MeasurementResult();
  const distance = new PlanarDistanceResult();
  distance.setDistance(random.floating());
  distance.setPlanes(createPlanes());
  result.setPlanarDistance(distance);
  return result;
}

export function createPlanarAngleResult(): MeasurementResult {
  const result = new MeasurementResult();
  const angle = new PlanarAngleResult();
  angle.setAngleInRadians(random.floating());
  angle.setPlanes(createPlanes());
  result.setPlanarAngle(angle);
  return result;
}

export function createMinimumDistanceResult(): MeasurementResult {
  const result = new MeasurementResult();
  const distance = new MinimumDistanceResult();
  distance.setDistance(random.floating());
  distance.setClosestPoint1(createVector3());
  distance.setClosestPoint2(createVector3());
  result.setMinimumDistance(distance);
  return result;
}

export function createPlanes(): PlanePair {
  const plane1 = new Plane();
  plane1.setD(random.floating());
  plane1.setNormal(createVector3());

  const plane2 = new Plane();
  plane2.setD(random.floating());
  plane2.setNormal(createVector3());

  const planes = new PlanePair();
  planes.setStart(plane1);
  planes.setEnd(plane2);
  return planes;
}

export function createVector3(): Vector3f {
  const vector = new Vector3f();
  vector.setX(random.floating());
  vector.setY(random.floating());
  vector.setZ(random.floating());
  return vector;
}
