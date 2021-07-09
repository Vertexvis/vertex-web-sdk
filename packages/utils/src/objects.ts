import isSimpleObject from 'is-plain-object';
import areEqual from 'lodash.isequal';

/* eslint-disable padding-line-between-statements */
/**
 * Returns a new object where any enumerable property from `other` are
 * recursively applied to `a`. Once a property is set, it will not be
 * overridden. This function is useful for constructing configs from a default
 * config.
 *
 * @example
 * ```
 * defaults({ 'a': [1] }, { 'b': 2 }, { 'a': [2] });
 * // => { a: [1], b: 2 }
 * ```
 */
export function defaults<A>(a: A): A;
export function defaults<A, B>(a: A, b: B): A & B;
export function defaults<A, B, C>(a: A, b: B, c: C): A & B & C;
export function defaults<A, B, C, D>(a: A, b: B, c: C, d: D): A & B & C & D;
export function defaults<A, R>(a: A, ...other: Record<string, unknown>[]): R;
export function defaults(
  ...objects: Record<string, unknown>[]
): Record<string, unknown> {
  const [a, ...other] = objects;
  const result = { ...a };

  if (other.length === 0) {
    return result;
  } else if (other.length === 1) {
    const b = other[0];
    for (const key in b) {
      if (result[key] == null) {
        result[key] = b[key];
      } else if (isPlainObject(result[key])) {
        result[key] = defaults(result[key], b[key]);
      }
    }

    return result;
  } else {
    return other.reduce((result, next) => defaults(result, next), a);
  }
}
/* eslint-enable padding-line-between-statements */

/**
 * Returns `true` if this is a plain object, which is defined by a type created
 * by the `Object` constructor. Returns `false` otherwise.
 *
 * @example
 * ```
 * isPlainObject(Object.create({})); //=> true
 * isPlainObject(Object.create(Object.prototype)); //=> true
 * isPlainObject({foo: 'bar'}); //=> true
 * isPlainObject({}); //=> true
 *
 * isPlainObject(1); //=> false
 * isPlainObject(['foo', 'bar']); //=> false
 * isPlainObject([]); //=> false
 * isPlainObject(new Foo); //=> false
 * isPlainObject(null); //=> false
 * isPlainObject(Object.create(null)); //=> false
 * ```
 */
export function isPlainObject(obj: unknown): boolean {
  return isSimpleObject(obj);
}

/**
 * Performs a deep comparison of two objects and returns `true` if they're
 * equal.
 *
 * This method supports comparing arrays, array buffers, booleans, date objects,
 * error objects, maps, numbers, Object objects, regexes, sets, strings,
 * symbols, and typed arrays. Object objects are compared by their own, not
 * inherited, enumerable properties. Functions and DOM nodes are compared by
 * strict equality, i.e. ===.
 *
 * @param a The object to compare with `b`.
 * @param b The object to compare with `a`.
 * @returns `true` if the two objects are equal. Otherwise `false`.
 */
export function isEqual(a: unknown, b: unknown): boolean {
  return areEqual(a, b);
}

/* eslint-disable padding-line-between-statements */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/**
 * Returns an array of key-value pairs for each enumerable key in `obj`.
 *
 * @example
 * ```
 * toPairs({a: 1, b: 2}); //=> [['a', 1], ['b', 2]]
 * toPairs(['a', 'b']); //=> [['0', 'a'], ['1', 'b']]
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 * toPairs(new Foo()); //=> [['a', 1], ['b', 2]]
 * ```
 */
export function toPairs<T>(obj: Record<string, T>): Array<[string, T]>;
export function toPairs<T>(obj: T[]): Array<[string, T]>;
export function toPairs(obj: object | null | undefined): Array<[string, any]>;
export function toPairs(obj: any): Array<[string, any]> {
  if (obj != null) {
    return Object.keys(obj).map((key) => [key, obj[key]]);
  } else {
    return [];
  }
}
/* eslint-enable padding-line-between-statements */
/* eslint-enable @typescript-eslint/ban-types */
/* eslint-enable @typescript-eslint/no-explicit-any */
/* eslint-enable @typescript-eslint/explicit-module-boundary-types */

/* eslint-disable padding-line-between-statements */
export function fromPairs<T>(
  pairs: Array<[string, T]> | undefined | null
): Record<string, T>;
export function fromPairs(
  pairs: Array<unknown[]> | undefined | null
): Record<string, unknown>;
export function fromPairs(pairs: unknown): Record<string, unknown> {
  if (Array.isArray(pairs)) {
    return pairs.reduce((result, pair) => {
      if (pair != null) {
        return { ...result, [pair[0]]: pair[1] };
      } else {
        return result;
      }
    }, {});
  } else {
    return {};
  }
}
/* eslint-enable padding-line-between-statements */
