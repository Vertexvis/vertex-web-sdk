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
  arrowTriangleLeft: Point.Point;
  arrowTriangleRight: Point.Point;
  arrowLineLeft: Point.Point;
  arrowLineRight: Point.Point;
  hashLeft: Point.Point;
  hashRight: Point.Point;
  radius: number;
}

export interface ArrowheadPoints {
  arrowLeftPoint: Point.Point;
  arrowRightPoint: Point.Point;
}

export function createArrowheadPoints(
  start: Point.Point,
  end: Point.Point,
  arrowSideLength: number,
  arrowHeadAngle: number
): ArrowheadPoints {
  const arrowTheta = Angle.toRadians(arrowHeadAngle / 2);
  const arrowOrthogonalVector = Point.orthogonalVector(start, end);
  const normalizedDirection = Point.normalDirectionVector(start, end);

  const arrowLeft = Point.subtract(
    end,
    Point.add(
      Point.scaleProportional(
        normalizedDirection,
        arrowSideLength * Math.cos(arrowTheta)
      ),
      Point.scaleProportional(
        arrowOrthogonalVector,
        arrowSideLength * Math.sin(arrowTheta)
      )
    )
  );
  const arrowRight = Point.subtract(
    end,
    Point.subtract(
      Point.scaleProportional(
        normalizedDirection,
        arrowSideLength * Math.cos(arrowTheta)
      ),
      Point.scaleProportional(
        arrowOrthogonalVector,
        arrowSideLength * Math.sin(arrowTheta)
      )
    )
  );

  return {
    arrowLeftPoint: arrowLeft,
    arrowRightPoint: arrowRight,
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

  // Shared arrowhead properties
  const arrowRelativeHeight = arrowHeadHeight / distance;
  const arrowBasePosition = Point.add(
    Point.scaleProportional(end, 1 - arrowRelativeHeight),
    Point.scaleProportional(start, arrowRelativeHeight)
  );

  // Triangle arrow position
  const triangleArrowTheta = Angle.toRadians(triangleArrowAngle / 2);
  const triangleArrowSideLength =
    arrowHeadHeight / Math.cos(triangleArrowTheta);
  const triangleArrow = createArrowheadPoints(
    start,
    end,
    triangleArrowSideLength,
    triangleArrowAngle
  );

  // Line arrow position
  const lineArrowTheta = Angle.toRadians(lineArrowAngle / 2);
  const lineArrowSideLength = arrowHeadHeight / Math.cos(lineArrowTheta);
  const lineArrow = createArrowheadPoints(
    start,
    end,
    lineArrowSideLength,
    lineArrowAngle
  );

  // Hash position
  // Setting the arrowHeadAngle to 180 degrees results in a
  // straight hash mark perpendicular to the direction of the line
  const hashLine = createArrowheadPoints(start, end, hashHeight, 180);

  return {
    tip: end,
    base: arrowBasePosition,
    arrowTriangleLeft: triangleArrow.arrowLeftPoint,
    arrowTriangleRight: triangleArrow.arrowRightPoint,
    arrowLineLeft: lineArrow.arrowLeftPoint,
    arrowLineRight: lineArrow.arrowRightPoint,
    hashLeft: hashLine.arrowLeftPoint,
    hashRight: hashLine.arrowRightPoint,
    radius: radius,
  };
}

export function arrowheadPointsToPolygonPoints(
  points: LineEndStylePoints
): string {
  return [
    points.tip,
    points.arrowTriangleRight,
    points.base,
    points.arrowTriangleLeft,
  ]
    .map((pt) => `${pt.x},${pt.y}`)
    .join(' ');
}

export function arrowheadPointsToPathPoints(
  points: LineEndStylePoints
): string {
  return `M${points.arrowLineRight.x} ${points.arrowLineRight.y} L${points.tip.x} ${points.tip.y} L${points.arrowLineLeft.x} ${points.arrowLineLeft.y} L${points.tip.x} ${points.tip.y} Z`;
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
