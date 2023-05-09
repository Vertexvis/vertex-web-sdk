import { DrawablePoints } from '../lib/transforms/drawable';
import { flattenPointArray } from '../lib/transforms/util';

export function createdPaddedFloat64Array(
  points: DrawablePoints
): Float64Array {
  return new Float64Array([
    ...flattenPointArray(points.toArray()),
    ...new Array(4).fill(0),
  ]);
}
