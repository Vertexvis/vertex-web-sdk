/**
 * This file is only for mapped TypeScript types. It should NOT include
 * constants classes or methods.
 */

/**
 * A type that recursively makes each property of `T` optional.
 *
 * @example
 *
 * type Foo = { a: number };
 * type Bar = { foo: Foo };
 * type Baz = DeepPartial<Bar>; // { foo?: { a?: number } }
 */
export type DeepPartial<T> = T extends object
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : T;
