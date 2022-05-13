import { Point } from '@vertexvis/geometry';

export function flattenPointArray(arr: Point.Point[]): number[] {
  return arr.reduce((res, pt) => [...res, pt.x, pt.y], [] as number[]);
}
