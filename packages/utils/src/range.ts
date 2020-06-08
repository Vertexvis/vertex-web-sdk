/**
 * A `Range` represents a sequence of numbers from a starting point to ending
 * point.
 */
export interface Range {
  start: number;
  end: number;
}

/**
 * Returns a new `Range` with the given start and end points.
 */
export const create = (start: number, end: number): Range => ({ start, end });

/**
 * Returns a new `Range` with the start and end points at the given position.
 */
export const at = (position: number): Range => ({
  start: position,
  end: position,
});

/**
 * Returns a new `Range` with the given start point and length.
 */
export const withLength = (start: number, len: number): Range => ({
  start,
  end: start + len - 1,
});

/**
 * Returns a range with the start and end points shifted by the given distance.
 */
export const add = (distance: number, range: Range): Range => {
  return create(range.start + distance, range.end + distance);
};

/**
 * Returns a range such that `range` is constrained to the start and end points
 * of `to`. The function will try to maintain the length of the range, but will
 * shrink the range if its length is greater than `to`.
 */
export const constrain = (range: Range, to: Range): Range => {
  if (contains(range, to)) {
    return range;
  } else if (length(range) > length(to)) {
    return to;
  } else if (range.start < to.start) {
    return create(to.start, to.start + length(range) - 1);
  } else {
    return create(to.end - length(range) + 1, to.end);
  }
};

/**
 * Checks if the given number or range is contained within another range.
 */
export const contains = (numOrRange: number | Range, range: Range): boolean => {
  if (typeof numOrRange === 'number') {
    return range.start <= numOrRange && numOrRange <= range.end;
  } else {
    return contains(numOrRange.start, range) && contains(numOrRange.end, range);
  }
};

/**
 * Returns a range that represents the overlap between `other` and `range`. If
 * the two ranges do not intersect, then `undefined` is returned.
 * @param other
 * @param range
 */
export const intersection = (other: Range, range: Range): Range | undefined => {
  if (intersects(other, range)) {
    return create(
      Math.max(other.start, range.start),
      Math.min(other.end, range.end)
    );
  }
};

/**
 * Returns `true` if `other` intersects with `range`.
 */
export const intersects = (other: Range, range: Range): boolean => {
  return (
    (other.start <= range.end && other.end >= range.start) ||
    (range.start <= other.end && range.end >= other.start)
  );
};

/**
 * Checks if a range has the same starting point as another range.
 */
export const isAt = (other: Range, range: Range): boolean => {
  return other.start === range.start;
};

/**
 * Returns `true` if a range's start point is after the starting point of
 * another range.
 */
export const isAfter = (other: Range, range: Range): boolean => {
  return other.start > range.start;
};

/**
 * Returns `true` if a range start at or is after another range.
 */
export const isAtOrAfter = (other: Range, range: Range): boolean => {
  return isAt(other, range) || isAfter(other, range);
};

/**
 * Returns `true` if a range's starting point is before another range's starting
 * point.
 */
export const isBefore = (other: Range, range: Range): boolean => {
  return other.start < range.start;
};

/**
 * Returns `true` if a range's starting point is at or before another range's
 * starting point.
 */
export const isAtOrBefore = (other: Range, range: Range): boolean => {
  return isAt(other, range) || isBefore(other, range);
};

/**
 * Returns the length of a range.
 */
export const length = (range: Range): number => {
  return range.end - range.start + 1;
};

/**
 * Returns a `Range` with its start and end points subtracted by the given
 * distance.
 */
export const subtract = (distance: number, range: Range): Range => {
  return add(distance * -1, range);
};

/**
 * Adjusts either the start or end position of a range so that its contained
 * within another range. Unlike `constrain`, this will not attempt to retain
 * the range's length.
 *
 * If `other` does not intersect with `to`, then the range cannot be truncated
 * and `undefined` is returned.
 */
export const truncate = (other: Range, to: Range): Range | undefined => {
  if (intersects(to, other)) {
    return create(Math.max(other.start, to.start), Math.min(other.end, to.end));
  }
};
