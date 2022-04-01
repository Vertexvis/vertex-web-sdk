import { Dimensions, Point } from '@vertexvis/geometry';

export function getClosestCenterToPoint(
  boxPoint: Point.Point,
  pointToMeasure: Point.Point,
  dimensions: Dimensions.Dimensions
): Point.Point {
  const topPoint = {
    x: boxPoint.x + dimensions.width / 2,
    y: boxPoint.y,
  };

  const bottomPoint = {
    x: boxPoint.x + dimensions.width / 2,
    y: boxPoint.y + dimensions.height,
  };

  const rightPoint = {
    x: boxPoint.x + dimensions.width,
    y: boxPoint.y + dimensions.height / 2,
  };

  const leftPoint = {
    x: boxPoint.x,
    y: boxPoint.y + dimensions.height / 2,
  };

  const candidates = [topPoint, bottomPoint, leftPoint, rightPoint];

  const distances = candidates.map((candidate) =>
    Point.distance(candidate, pointToMeasure)
  );

  const candidateIndex = distances.indexOf(Math.min(...distances));
  return candidates[candidateIndex];
}
