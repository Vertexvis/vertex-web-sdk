import { Point } from '@vertexvis/geometry';

export function parsePoints(
  value: string | Point.Point[] | undefined
): Point.Point[] | undefined {
  return typeof value === 'string'
    ? value.split(' ').map(Point.fromJson)
    : value;
}

export function smoothPointsRollingAvg(points: Point.Point[]): Point.Point[] {
  let subsets: Array<Point.Point[]> = [];

  for (let i = 0; i < Math.ceil(points.length); i += 3) {
    subsets = [...subsets, points.slice(i, i + 3)];
  }

  console.log(subsets);

  return subsets.map((set) =>
    set.reduce(
      (avgPt, pt) =>
        avgPt.x === 0 && avgPt.y === 0
          ? pt
          : Point.scale(Point.add(avgPt, pt), 0.5, 0.5),
      Point.create()
    )
  );
}

interface PathDescriptor {
  start: Point.Point;
  middle?: Point.Point;
  end: Point.Point;
}

export function smoothPointsCurve(points: Point.Point[]): PathDescriptor[] {
  return [];
}

export function smoothPointsSignificant(
  points: Point.Point[],
  lineThreshold = 10,
  curveThreshold = 2
): Point.Point[] {
  let lastSignificantPoint = points[0];

  return [
    ...points.slice(0, -1).reduce(
      (pts, pt) => {
        const xDiff = Math.abs(lastSignificantPoint.x - pt.x);
        const yDiff = Math.abs(lastSignificantPoint.y - pt.y);

        if (xDiff > curveThreshold && yDiff > curveThreshold) {
          lastSignificantPoint = pt;
          return [...pts, pt];
        } else if (xDiff > lineThreshold || yDiff > lineThreshold) {
          lastSignificantPoint = pt;
          return [...pts, pt];
        }
        return pts;
      },
      [lastSignificantPoint] as Point.Point[]
    ),
    points[points.length - 1],
  ];
}

export function toPath(points: Point.Point[]): string {
  return points.reduce(
    (d, pt) => `${d}L${pt.x},${pt.y}`,
    points.length > 0 ? `M${points[0].x},${points[0].y}` : `M0,0`
  );
}

export function toCurvePath(points: Point.Point[]): string {
  let subsets: Array<Point.Point[]> = [];

  for (let i = 0; i < Math.ceil(points.length); i += 2) {
    subsets = [...subsets, points.slice(i, i + 3)];
  }

  const toCurvePoints = (points: Point.Point[]): Point.Point[] => {
    const startToMiddle = Point.distance(points[0], points[1]);
    const middleToEnd = Point.distance(points[1], points[2]);

    const scale = startToMiddle > 50 && middleToEnd > 50 ? 1 : 1;

    return [
      // Point.scale(
      //   points[0],
      //   points[1].x / points[0].x,
      //   points[1].y / points[0].y
      // ),
      // Point.scale(
      //   points[2],
      //   points[2].x / points[0].x,
      //   points[2].y / points[0].y
      // ),
      // points[2],

      Point.scale(points[1], scale, scale),
      Point.scale(points[1], scale, scale),
      points[2],
    ];
  };

  return subsets
    .map((set) => (set.length >= 3 ? toCurvePoints(set) : set))
    .map((set, i) =>
      set.length >= 3
        ? `C${set[0].x},${set[0].y},${set[1].x},${set[1].y},${set[2].x},${set[2].y}`
        : set
            .map((pt) => `C${pt.x},${pt.y},${pt.x},${pt.y},${pt.x},${pt.y}`)
            .join('')
    )
    .join('');

  // return points.reduce(
  //   (d, pt) => `${d}L${pt.x},${pt.y}`,
  //   points.length > 0 ? `M${points[0].x},${points[0].y}` : `M0,0`
  // );
}

export function isCurve(points: Point.Point[]): boolean {
  const xDiff = Math.abs((points[0].x + points[2].x) / 2.0 - points[1].x) > 2;
  const yDiff = Math.abs((points[0].y + points[2].y) / 2.0 - points[1].y) > 2;

  return xDiff || yDiff;
}

export function isVertexViewerFreeformMarkup(
  el: unknown
): el is HTMLVertexViewerMarkupFreeformElement {
  return (
    el instanceof HTMLElement && el.nodeName === 'VERTEX-VIEWER-MARKUP-FREEFORM'
  );
}
