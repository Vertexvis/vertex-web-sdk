import { Angle, Matrix, Point } from '@vertexvis/geometry';

export interface ArrowheadPoints {
  tip: Point.Point;
  left: Point.Point;
  right: Point.Point;
  base: Point.Point;
}

export function createArrowheadPoints(
  start: Point.Point,
  end: Point.Point,
  arrowAngle = 60
): ArrowheadPoints {
  const distance = Point.distance(start, end);
  const angle = Angle.normalize(
    Angle.toDegrees(Angle.fromPoints(start, end)) - 270
  );

  // Adjust the arrow height in relation to the distance between the to and from
  // points. Uses a min and max size so the arrow doesn't become cartoonish.
  const height = Math.max(4, Math.min(16, distance * 0.25));
  const sideLength = height / Math.cos(Angle.toRadians(90 - arrowAngle));

  const rotation = Matrix.rotation(angle);
  const arrowLeft = Point.polar(sideLength, Angle.toRadians(arrowAngle * 2));
  const arrowRight = Point.polar(sideLength, Angle.toRadians(arrowAngle));
  const arrowBase = Point.polar(height, Angle.toRadians(90));

  return {
    tip: end,
    left: Point.add(end, Matrix.transformPoint(rotation, arrowLeft)),
    right: Point.add(end, Matrix.transformPoint(rotation, arrowRight)),
    base: Point.add(end, Matrix.transformPoint(rotation, arrowBase)),
  };
}

export function arrowheadPointsToPolygonPoints(
  points: ArrowheadPoints
): string {
  return [points.tip, points.right, points.base, points.left]
    .map((pt) => `${pt.x},${pt.y}`)
    .join(' ');
}

export function isVertexViewerArrowMarkup(
  el: unknown
): el is HTMLVertexViewerMarkupArrowElement {
  return (
    el instanceof HTMLElement && el.nodeName === 'VERTEX-VIEWER-MARKUP-ARROW'
  );
}

export function parsePoint(
  value: string | Point.Point | undefined
): Point.Point | undefined {
  return typeof value === 'string' ? Point.fromJson(value) : value;
}
