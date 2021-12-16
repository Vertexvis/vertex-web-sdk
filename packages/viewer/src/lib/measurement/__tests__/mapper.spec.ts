import { MeasurementResult } from '@vertexvis/scene-view-protos/core/protos/measurement_pb';
import { Mapper as M } from '@vertexvis/utils';
import {
  createMeasureResponse,
  createMinimumDistanceResult,
  createPlanarAngleResult,
  createPlanarDistanceResult,
  createSurfaceAreaResult,
} from '../../../testing';
import { mapMeasureResponse, mapMeasureResponseOrThrow } from '../mapper';

describe('mapMeasureResponse', () => {
  it('maps a response with a planar distance', () => {
    const resp = createMeasureResponse(createPlanarDistanceResult());
    const res = mapMeasureResponse(resp.toObject());
    expect(M.isInvalid(res)).toBe(false);
  });

  it('maps a response with a planar angle', () => {
    const resp = createMeasureResponse(createPlanarAngleResult());
    const res = mapMeasureResponse(resp.toObject());
    expect(M.isInvalid(res)).toBe(false);
  });

  it('maps a response with a minimum distance', () => {
    const resp = createMeasureResponse(createMinimumDistanceResult());
    const res = mapMeasureResponse(resp.toObject());
    expect(M.isInvalid(res)).toBe(false);
  });

  it('maps a response with a surface area', () => {
    const resp = createMeasureResponse(createSurfaceAreaResult());
    const res = mapMeasureResponse(resp.toObject());
    expect(M.isInvalid(res)).toBe(false);
  });

  it('throws if response invalid', () => {
    const invalidResult = new MeasurementResult();
    const resp = createMeasureResponse(invalidResult);
    expect(() => mapMeasureResponseOrThrow(resp.toObject())).toThrow();
  });
});
