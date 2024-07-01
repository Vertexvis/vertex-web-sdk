import { MeasurementResult } from '@vertexvis/scene-view-protos/core/protos/measurement_pb';
import { Mapper as M } from '@vertexvis/utils';

import {
  makeMeasureResponse,
  makeMinimumDistanceResult,
  makePlanarAngleResult,
  makePlanarDistanceResult,
  makeSurfaceAreaResult,
} from '../../../testing';
import { mapMeasureResponse, mapMeasureResponseOrThrow } from '../mapper';

describe('mapMeasureResponse', () => {
  it('maps a response with a planar distance', () => {
    const resp = makeMeasureResponse(makePlanarDistanceResult());
    const res = mapMeasureResponse(resp.toObject());
    expect(M.isInvalid(res)).toBe(false);
  });

  it('maps a response with a planar angle', () => {
    const resp = makeMeasureResponse(makePlanarAngleResult());
    const res = mapMeasureResponse(resp.toObject());
    expect(M.isInvalid(res)).toBe(false);
  });

  it('maps a response with a minimum distance', () => {
    const resp = makeMeasureResponse(makeMinimumDistanceResult());
    const res = mapMeasureResponse(resp.toObject());
    expect(M.isInvalid(res)).toBe(false);
  });

  it('maps a response with a surface area', () => {
    const resp = makeMeasureResponse(makeSurfaceAreaResult());
    const res = mapMeasureResponse(resp.toObject());
    expect(M.isInvalid(res)).toBe(false);
  });

  it('throws if response invalid', () => {
    const invalidResult = new MeasurementResult();
    const resp = makeMeasureResponse(invalidResult);
    expect(() => mapMeasureResponseOrThrow(resp.toObject())).toThrow();
  });
});
