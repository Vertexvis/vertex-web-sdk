import { Angle } from '@vertexvis/geometry';

import * as Point from '../../../../geometry/src/point';

export type LineEndStyle =
  | 'arrow-triangle'
  | 'arrow-line'
  | 'dot'
  | 'hash'
  | 'none';

export interface LineEndStylePoints {
  tip: Point.Point;
  base: Point.Point;
  arrowTriangle: ArrowheadPoints;
  arrowLine: ArrowheadPoints;
  hash: ArrowheadPoints;
  radius: number;
}

export interface ArrowheadPoints {
  leftPoint: Point.Point;
  rightPoint: Point.Point;
}

export function createArrowheadPoints(
  start: Point.Point,
  end: Point.Point,
  arrowSideLength: number,
  arrowHeadTheta: number
): ArrowheadPoints {
  const arrowOrthogonalVector = Point.orthogonalVector(start, end);
  const normalizedDirection = Point.normalDirectionVector(start, end);

  const arrowLeft = Point.subtract(
    end,
    Point.add(
      Point.scaleProportional(
        normalizedDirection,
        arrowSideLength * Math.cos(arrowHeadTheta)
      ),
      Point.scaleProportional(
        arrowOrthogonalVector,
        arrowSideLength * Math.sin(arrowHeadTheta)
      )
    )
  );
  const arrowRight = Point.subtract(
    end,
    Point.subtract(
      Point.scaleProportional(
        normalizedDirection,
        arrowSideLength * Math.cos(arrowHeadTheta)
      ),
      Point.scaleProportional(
        arrowOrthogonalVector,
        arrowSideLength * Math.sin(arrowHeadTheta)
      )
    )
  );

  return {
    leftPoint: arrowLeft,
    rightPoint: arrowRight,
  };
}

export function createLineEndStylePoints(
  start: Point.Point,
  end: Point.Point,
  triangleArrowAngle = 65,
  lineArrowAngle = 85
): LineEndStylePoints {
  // Adjust the size of the end style to the distance between the start and end points
  const distance = Point.distance(start, end);
  const arrowHeadHeight = Math.max(4, Math.min(16, distance * 0.25));
  const hashHeight = Math.max(4, Math.min(12, distance * 0.16));
  const radius = Math.min(5, distance * 0.1);

  // Triangle arrow position
  const triangleArrowRelativeHeight = arrowHeadHeight / distance;
  const triangleArrowBasePosition = Point.add(
    Point.scaleProportional(end, 1 - triangleArrowRelativeHeight),
    Point.scaleProportional(start, triangleArrowRelativeHeight)
  );
  const triangleArrowTheta = Angle.toRadians(triangleArrowAngle / 2);
  const triangleArrowSideLength =
    arrowHeadHeight / Math.cos(triangleArrowTheta);
  const triangleArrow = createArrowheadPoints(
    start,
    end,
    triangleArrowSideLength,
    triangleArrowTheta
  );

  // Line arrow position
  const lineArrowTheta = Angle.toRadians(lineArrowAngle / 2);
  const lineArrowSideLength = arrowHeadHeight / Math.cos(lineArrowTheta);
  const lineArrow = createArrowheadPoints(
    start,
    end,
    lineArrowSideLength,
    lineArrowTheta
  );

  // Hash position
  // Setting the arrowHeadAngle to 90 degrees results in a
  // straight hash mark perpendicular to the direction of the line
  const hashLineTheta = Angle.toRadians(90);
  const hashLine = createArrowheadPoints(start, end, hashHeight, hashLineTheta);

  return {
    tip: end,
    base: triangleArrowBasePosition,
    arrowTriangle: triangleArrow,
    arrowLine: lineArrow,
    hash: hashLine,
    radius: radius,
  };
}

export function arrowheadPointsToPolygonPoints(
  points: LineEndStylePoints
): string {
  return [
    points.tip,
    points.arrowTriangle.rightPoint,
    points.base,
    points.arrowTriangle.leftPoint,
  ]
    .map((pt) => `${pt.x},${pt.y}`)
    .join(' ');
}

export function arrowheadPointsToPathPoints(
  points: LineEndStylePoints
): string {
  return `M${points.arrowLine.rightPoint.x} ${points.arrowLine.rightPoint.y} L${points.tip.x} ${points.tip.y} L${points.arrowLine.leftPoint.x} ${points.arrowLine.leftPoint.y} L${points.tip.x} ${points.tip.y} Z`;
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
