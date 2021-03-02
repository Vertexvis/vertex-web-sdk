/**
 * This file is only for mapped TypeScript types. It should NOT include
 * constants classes or methods.
 */

/**
 * A type that recursively makes each property of `T` optional.
 *
 * @example
 * ```
 * type Foo = { a: number };
 * type Bar = { foo: Foo };
 * type Baz = DeepPartial<Bar>; // { foo?: { a?: number } }
 * ```
 */
export type DeepPartial<T> = T extends Record<string, unknown>
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : T;

/**
 * A type that recursively makes each property of `T` required.
 * Optionally excluding a nested path specified by a list of keys.
 *
 * @example
 * ```
 * type Foo = { a?: { c?: number }, b?: string };
 * type Bar = { foo: Foo };
 * type Baz = DeepRequired<Bar, []>; // { foo: { a: { c: number }, b: string } }
 * type Baz = DeepRequired<Bar, ['a', 'c']>; // { foo: { a: { c?: number }, b: string } }
 * type Baz = DeepRequired<Bar, ['a'] | ['b']>; // { foo: { a: { c?: number }, b?: string } }
 * ```
 */
// https://stackoverflow.com/a/57837897
export type DeepRequired<T, P extends string[]> = T extends unknown[]
  ? T
  : T extends Record<string, unknown>
  ? Pick<T, Extract<keyof T, P[0]>> &
      Required<
        {
          [K in Exclude<keyof T, P[0]>]: NonNullable<
            DeepRequired<T[K], ShiftUnion<K, P>>
          >;
        }
      >
  : T;

/* eslint-disable @typescript-eslint/no-unused-vars */
type Shift<T extends unknown[]> = ((...t: T) => unknown) extends (
  first: unknown,
  ...rest: infer Rest
) => unknown
  ? Rest
  : never;
/* eslint-enable @typescript-eslint/no-unused-vars */

type ShiftUnion<
  P extends PropertyKey,
  T extends unknown[]
> = T extends unknown[] ? (T[0] extends P ? Shift<T> : never) : never;

/**
 * A type that extends `Required` that in addition to making fields
 * not undefined, also makes them not nullable.
 *
 * @example
 * ```
 * type Foo = { a?: number | null };
 * type Bar = RequiredAndNonNullable<Bar>; // { a: number }
 * ```
 */
export type RequiredAndNonNullable<T> = Required<
  {
    [P in keyof T]: NonNullable<T[P]>;
  }
>;
