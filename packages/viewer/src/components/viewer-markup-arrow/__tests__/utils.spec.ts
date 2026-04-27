import { Point } from '@vertexvis/geometry';

import {
  arrowheadPointsToCirclePoints,
  arrowheadPointsToHashPoints,
  arrowheadPointsToPathPoints,
  arrowheadPointsToPolygonPoints,
  createLineAnchorStylePoints,
  scalePointProportional,
} from '../utils';

describe('viewer-markup-arrow utils', () => {
  const start = Point.create(0, 0);
  const end = Point.create(0.5, 0.5);

  describe('arrowheadPointsToPolygonPoints', () => {
    it('should return the correct polygon points', () => {
      const arrowheadPoints = createLineAnchorStylePoints(start, end);

      const points = arrowheadPointsToPolygonPoints(arrowheadPoints);

      expect(points).toBe(
        `${arrowheadPoints.tip.x},${arrowheadPoints.tip.y} ${arrowheadPoints.arrowTriangle.rightPoint.x},${arrowheadPoints.arrowTriangle.rightPoint.y} ${arrowheadPoints.base.x},${arrowheadPoints.base.y} ${arrowheadPoints.arrowTriangle.leftPoint.x},${arrowheadPoints.arrowTriangle.leftPoint.y}`
      );
    });

    it('should return the correct polygon points when scaled', () => {
      const scale = 2;
      const arrowheadPoints = createLineAnchorStylePoints(start, end);
      const scaledRight = scalePointProportional(
        arrowheadPoints.tip,
        arrowheadPoints.arrowTriangle.rightPoint,
        scale
      );
      const scaledBase = scalePointProportional(
        arrowheadPoints.tip,
        arrowheadPoints.base,
        scale
      );
      const scaledLeft = scalePointProportional(
        arrowheadPoints.tip,
        arrowheadPoints.arrowTriangle.leftPoint,
        scale
      );

      const points = arrowheadPointsToPolygonPoints(arrowheadPoints, scale);

      expect(points).toBe(
        `${arrowheadPoints.tip.x},${arrowheadPoints.tip.y} ${scaledRight.x},${scaledRight.y} ${scaledBase.x},${scaledBase.y} ${scaledLeft.x},${scaledLeft.y}`
      );
    });
  });

  describe('arrowheadPointsToPathPoints', () => {
    it('should return the correct path points', () => {
      const arrowheadPoints = createLineAnchorStylePoints(start, end);

      const points = arrowheadPointsToPathPoints(arrowheadPoints);

      expect(points).toBe(
        `M${arrowheadPoints.arrowLine.rightPoint.x} ${arrowheadPoints.arrowLine.rightPoint.y} L${arrowheadPoints.tip.x} ${arrowheadPoints.tip.y} L${arrowheadPoints.arrowLine.leftPoint.x} ${arrowheadPoints.arrowLine.leftPoint.y} L${arrowheadPoints.tip.x} ${arrowheadPoints.tip.y} Z`
      );
    });

    it('should return the correct path points when scaled', () => {
      const scale = 2;
      const arrowheadPoints = createLineAnchorStylePoints(start, end);
      const scaledRight = scalePointProportional(
        arrowheadPoints.tip,
        arrowheadPoints.arrowLine.rightPoint,
        scale
      );
      const scaledLeft = scalePointProportional(
        arrowheadPoints.tip,
        arrowheadPoints.arrowLine.leftPoint,
        scale
      );

      const points = arrowheadPointsToPathPoints(arrowheadPoints, scale);

      expect(points).toBe(
        `M${scaledRight.x} ${scaledRight.y} L${arrowheadPoints.tip.x} ${arrowheadPoints.tip.y} L${scaledLeft.x} ${scaledLeft.y} L${arrowheadPoints.tip.x} ${arrowheadPoints.tip.y} Z`
      );
    });
  });

  describe('arrowheadPointsToHashPoints', () => {
    it('should return the correct hash points', () => {
      const arrowheadPoints = createLineAnchorStylePoints(start, end);

      const points = arrowheadPointsToHashPoints(arrowheadPoints);

      expect(points).toMatchObject({
        x1: arrowheadPoints.hash.rightPoint.x,
        y1: arrowheadPoints.hash.rightPoint.y,
        x2: arrowheadPoints.hash.leftPoint.x,
        y2: arrowheadPoints.hash.leftPoint.y,
      });
    });

    it('should return the correct hash points when scaled', () => {
      const scale = 2;
      const arrowheadPoints = createLineAnchorStylePoints(start, end);
      const scaledRight = scalePointProportional(
        arrowheadPoints.tip,
        arrowheadPoints.hash.rightPoint,
        scale
      );
      const scaledLeft = scalePointProportional(
        arrowheadPoints.tip,
        arrowheadPoints.hash.leftPoint,
        scale
      );

      const points = arrowheadPointsToHashPoints(arrowheadPoints, scale);

      expect(points).toMatchObject({
        x1: scaledRight.x,
        y1: scaledRight.y,
        x2: scaledLeft.x,
        y2: scaledLeft.y,
      });
    });
  });

  describe('arrowheadPointsToCirclePoints', () => {
    it('should return the correct circle points', () => {
      const arrowheadPoints = createLineAnchorStylePoints(start, end);

      const points = arrowheadPointsToCirclePoints(arrowheadPoints);

      expect(points).toMatchObject({
        cx: arrowheadPoints.tip.x,
        cy: arrowheadPoints.tip.y,
        r: arrowheadPoints.radius,
      });
    });

    it('should return the correct circle points when scaled', () => {
      const scale = 2;
      const arrowheadPoints = createLineAnchorStylePoints(start, end);

      const points = arrowheadPointsToCirclePoints(arrowheadPoints, scale);

      expect(points).toMatchObject({
        cx: arrowheadPoints.tip.x,
        cy: arrowheadPoints.tip.y,
        r: arrowheadPoints.radius * scale,
      });
    });
  });
});
