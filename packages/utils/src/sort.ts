/**
 * A `Comparator` defines a function that computes the order of two values.
 */
export type Comparator<T> = (a: T, b: T) => number;

/**
 * A comparator that sorts a number or string in ascending order.
 */
export const asc = (a: number | string, b: number | string): number => {
  if (a < b) {
    return -1;
  } else if (a > b) {
    return 1;
  } else {
    return 0;
  }
};

/**
 * A comparator that sorts a number or string in descending order.
 */
export const desc = (a: number | string, b: number | string): number => {
  return reverse(asc)(a, b);
};

/**
 * A comparator that reverses the sort order of another comparator.
 */
export const reverse = <T>(comparator: Comparator<T>): Comparator<T> => {
  return (a, b) => -comparator(a, b);
};

/**
 * A comparator that plucks the first element of an array and passes that value
 * to the given comparator for sorting.
 */
export const head = <T>(comparator: Comparator<T>): Comparator<T[]> => {
  return ([a], [b]) => comparator(a, b);
};
