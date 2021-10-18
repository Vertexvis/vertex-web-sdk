/**
 * A module for defining functional schemas to map between different types. This
 * module is useful for parsing to or from JSON/protobufs to domain types.
 *
 * Mappers support greedy validation, so all validation errors are aggregated
 * and reported vs failing on the first invalid input.
 *
 * @example
 *
 * ```ts
 * import { Mapper as M } from '@vertexvis/utils';
 *
 * interface Address {
 *   address: string;
 *   city: string;
 *   state: string;
 *   zip: string;
 * }
 *
 * interface Person {
 *   name: string;
 *   addresses: Address[];
 * }
 *
 * type AddressJson = Partial<Address>;
 * type PersonJson = {
 *   name?: string;
 *   addresses?: AddressJson[];
 * }
 *
 * const mapAddress: M.Func<AddressJson, Address> = M.defineMapper(
 *   M.read(
 *     M.requireProp('address'),
 *     M.requireProp('city'),
 *     M.requireProp('state'),
 *     M.requireProp('zip')
 *   ),
 *   ([address, city, state, zip]) => ({
 *     address, city, state, zip
 *   })
 * );
 *
 * const mapPerson: M.Func<PersonJson, Person> = M.defineMapper(
 *   M.read(
 *     M.requireProp('name'),
 *     M.mapProp(
 *       'addresses',
 *       M.compose(M.required('addresses'), M.mapArray(mapAddress))
 *     )
 *   ),
 *   ([name, addresses]) => ({ name, addresses })
 * );
 *
 * const person = mapPerson({
 *   name: 'John',
 *   addresses: [{ address: '123', city: 'Ames', state: 'IA', zip: '50010' }]
 * });
 *
 * const invalidPerson = mapPerson({
 *   addresses: [{ city: 'Ames', state: 'IA', zip: '50010' }]
 * });
 * ```
 * // {
 * //   errors: ["Name is required.", "Address is required."]
 * // }
 *
 * @module
 */

/**
 * An error that is thrown when validation of a schema fails.
 *
 * @see {@link ifInvalidThrow} - for throwing errors on invalid input.
 */
export class MapperValidationError extends Error {
  public constructor(public readonly errors: string[]) {
    super('Validation error while mapping object.');
  }
}

/**
 * A type that captures all errors on invalid input.
 */
export interface Invalid {
  /**
   * A list of errors in the input.
   */
  errors: string[];
}

/**
 * A type that represents either a valid or invalid input.
 */
export type Validated<T> = Invalid | T;

/**
 * A function that transforms an input into another type, or an invalid result
 * if the input violates the schema.
 */
export type Func<T, R> = (input: T) => Validated<R>;

/**
 * A function that transforms an input into another type, or throws if the input
 * is invalid.
 */
export type ThrowIfInvalidFunc<T, R> = (input: T) => R;

/**
 * Returns a mapper that asserts the input is not null or not undefined.
 *
 * @param name A name to report when invalid.
 */
export function required<T>(
  name: string
): Func<T | null | undefined, NonNullable<T>> {
  return (input) => {
    if (input != null) {
      return input as NonNullable<T>;
    } else {
      return { errors: [`${name} is required.`] };
    }
  };
}

/**
 * Returns a mapper that asserts a property on the input is not null or not
 * defined.
 *
 * @param prop The prop to assert.
 * @returns A mapper that returns the property's value.
 */
export function requiredProp<T, P extends keyof T>(
  prop: P
): Func<T, NonNullable<T[P]>> {
  return (obj) => {
    const value = obj[prop];
    if (value != null) {
      return value as NonNullable<T[P]>;
    } else {
      return { errors: [`${prop} is required`] };
    }
  };
}

/**
 * Returns a mapper that invokes a function if the input is not null or not
 * undefined.
 *
 * @param mapper A mapping function.
 */
export function ifDefined<T, R>(
  mapper: Func<T, R | null | undefined>
): Func<T | null | undefined, R | null | undefined> {
  return (input) => {
    if (input != null) {
      return mapper(input);
    } else {
      return input as undefined;
    }
  };
}

/**
 * Returns a mapper that extracts a property's value.
 *
 * @param prop The property to extract.
 */
export function getProp<T, P extends keyof T>(prop: P): Func<T, T[P]> {
  return (input) => {
    return input[prop];
  };
}

/**
 * Returns a mapper that will invoke a mapping function on an input's property.
 *
 * @param prop The name of the property to map over.
 * @param mapper A function that will be invoked with the property's value.
 */
export function mapProp<T, P extends keyof T, R>(
  prop: P,
  mapper: Func<T[P], R>
): Func<T, R> {
  return (input) => {
    const value = input[prop];
    return mapper(value);
  };
}

/**
 * Returns a mapper that will check if the given property is defined, and if so
 * invoke the given mapping function.
 *
 * @param prop The name of the property to map over.
 * @param mapper A function that will be invoked with the property's value if
 *   the property is defined.
 */
export function mapRequiredProp<T, P extends keyof T, R>(
  prop: P,
  mapper: Func<NonNullable<T[P]>, R>
): Func<T, R> {
  return mapProp(prop, compose(required(prop.toString()), mapper));
}

/**
 * Returns a mapper that will invoke a mapper over each value in the input
 * array. Returns `Invalid` containing errors for all invalid values in the
 * array.
 *
 * @param mapper A function that will be invoked with each array value.
 * @returns
 */
export function mapArray<T, R>(mapper: Func<T, R>): Func<T[], R[]> {
  return (inputs) => {
    if (inputs.length > 0) {
      const [head, ...tail] = inputs;
      const first = mapper(head);

      return tail.reduce(
        (res, input) => {
          const value = mapper(input);
          if (isInvalid(value)) {
            return isInvalid(res)
              ? { errors: [...res.errors, ...value.errors] }
              : value;
          } else if (isInvalid(res)) {
            return res;
          } else {
            return [...res, value];
          }
        },
        isInvalid(first) ? first : [first]
      );
    } else {
      return [];
    }
  };
}

/**
 * A type guard that checks if the object is an `Invalid` type.
 */
export function isInvalid(obj: unknown): obj is Invalid {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return obj != null && (obj as any).hasOwnProperty('errors');
}

/**
 * Returns a function that throws an error if the input is invalid. Otherwise
 * returns the result.
 *
 * @param mapper A mapper that will be invoked with the input.
 * @throws {@link MapperValidationError} If the input is invalid.
 */
export function ifInvalidThrow<T, R>(
  mapper: Func<T, R>
): ThrowIfInvalidFunc<T, R> {
  return (input) => {
    const value = mapper(input);
    if (isInvalid(value)) {
      throw new MapperValidationError(value.errors);
    } else return value;
  };
}

function ifValidThen<T, R>(
  obj: Validated<T>,
  f: (value: T) => R
): Validated<R> {
  if (isInvalid(obj)) {
    return obj;
  } else {
    return f(obj);
  }
}

/* eslint-disable padding-line-between-statements */
/**
 * Accumulates the results of mappers into an array.
 *
 * @param mappers A sequence of mappers that will be invoked for the input.
 * @see {@link defineMapper} - This function is normally used with
 *   `defineMapper`.
 */
export function read<T, R1>(a: Func<T, R1>): Func<T, [R1]>;
export function read<T, R1, R2>(
  a: Func<T, R1>,
  b: Func<T, R2>
): Func<T, [R1, R2]>;
export function read<T, R1, R2, R3>(
  a: Func<T, R1>,
  b: Func<T, R2>,
  c: Func<T, R3>
): Func<T, [R1, R2, R3]>;
export function read<T, R1, R2, R3, R4>(
  a: Func<T, R1>,
  b: Func<T, R2>,
  c: Func<T, R3>,
  d: Func<T, R4>
): Func<T, [R1, R2, R3, R4]>;
export function read<T, R1, R2, R3, R4, R5>(
  a: Func<T, R1>,
  b: Func<T, R2>,
  c: Func<T, R3>,
  d: Func<T, R4>,
  e: Func<T, R5>
): Func<T, [R1, R2, R3, R4, R5]>;
export function read<T, R1, R2, R3, R4, R5, R6>(
  a: Func<T, R1>,
  b: Func<T, R2>,
  c: Func<T, R3>,
  d: Func<T, R4>,
  e: Func<T, R5>,
  f: Func<T, R6>
): Func<T, [R1, R2, R3, R4, R5, R6]>;
export function read<T, R1, R2, R3, R4, R5, R6, R7>(
  a: Func<T, R1>,
  b: Func<T, R2>,
  c: Func<T, R3>,
  d: Func<T, R4>,
  e: Func<T, R5>,
  f: Func<T, R6>,
  g: Func<T, R7>
): Func<T, [R1, R2, R3, R4, R5, R6, R7]>;
export function read<T, R1, R2, R3, R4, R5, R6, R7, R8>(
  a: Func<T, R1>,
  b: Func<T, R2>,
  c: Func<T, R3>,
  d: Func<T, R4>,
  e: Func<T, R5>,
  f: Func<T, R6>,
  g: Func<T, R7>,
  h: Func<T, R8>
): Func<T, [R1, R2, R3, R4, R5, R6, R7, R8]>;
export function read<T, R1, R2, R3, R4, R5, R6, R7, R8, R9>(
  a: Func<T, R1>,
  b: Func<T, R2>,
  c: Func<T, R3>,
  d: Func<T, R4>,
  e: Func<T, R5>,
  f: Func<T, R6>,
  g: Func<T, R7>,
  h: Func<T, R8>,
  i: Func<T, R9>
): Func<T, [R1, R2, R3, R4, R5, R6, R7, R8, R9]>;
export function read(
  ...mappers: Func<unknown, unknown>[]
): Func<unknown, unknown[]> {
  return (input) => {
    return mappers.reduce((res: Validated<unknown[]>, decoder) => {
      const value = decoder(input);
      if (isInvalid(value)) {
        return isInvalid(res)
          ? { errors: [...res.errors, ...value.errors] }
          : value;
      } else if (isInvalid(res)) {
        return res;
      } else {
        return [...res, value];
      }
    }, []);
  };
}
/* eslint-enable padding-line-between-statements */

/**
 * Defines a mapper that reads the values from an input and invokes a builder to
 * transform data from one schema to another.
 *
 * @example
 *
 * ```ts
 * import { Mapper as M } from '@vertexvis/utils';
 *
 * interface Address {
 *   address: string;
 *   city: string;
 *   state: string;
 *   zip: string;
 * }
 *
 * interface Person {
 *   name: string;
 *   addresses: Address[];
 * }
 *
 * type AddressJson = Partial<Address>;
 * type PersonJson = {
 *   name?: string;
 *   addresses?: AddressJson[];
 * }
 *
 * const mapAddress: M.Func<AddressJson, Address> = M.defineMapper(
 *   M.read(
 *     M.requireProp('address'),
 *     M.requireProp('city'),
 *     M.requireProp('state'),
 *     M.requireProp('zip')
 *   ),
 *   ([address, city, state, zip]) => ({
 *     address, city, state, zip
 *   })
 * );
 *
 * const mapPerson: M.Func<PersonJson, Person> = M.defineMapper(
 *   M.read(
 *     M.requireProp('name'),
 *     M.mapProp(
 *       'addresses',
 *       M.compose(M.required('addresses'), M.mapArray(mapAddress))
 *     )
 *   ),
 *   ([name, addresses]) => ({ name, addresses })
 * )
 *
 * const person = mapPerson({
 *   name: 'John',
 *   addresses: [{ address: '123', city: 'Ames', state: 'IA', zip: '50010' }]
 * })
 * ```
 *
 * @param reader The mapper that reads values from the input an creates an
 *   intermediate format that will be passed to the `builder`.
 * @param builder A mapper that takes the output of `reader` and constructs the
 *   output format.
 * @see {@link read} - a helper function to read and validate input values.
 */
export function defineMapper<T, V, R>(
  reader: Func<T, V>,
  builder: Func<V, R>
): Func<T, R> {
  return (input) => {
    const values = reader(input);
    return ifValidThen(values, builder);
  };
}

/* eslint-disable padding-line-between-statements */
/**
 * Returns a mapper that passes the output of each mapper to the next mapper.
 */
export function compose<T, A, R>(a: Func<T, A>, b: Func<A, R>): Func<T, R>;
export function compose<T, A, B, R>(
  a: Func<T, A>,
  b: Func<A, B>,
  c: Func<B, R>
): Func<T, R>;
export function compose<T, A, B, C, R>(
  a: Func<T, A>,
  b: Func<A, B>,
  c: Func<B, C>,
  d: Func<C, R>
): Func<T, R>;
export function compose<T, A, B, C, D, R>(
  a: Func<T, A>,
  b: Func<A, B>,
  c: Func<B, C>,
  d: Func<C, D>,
  e: Func<D, R>
): Func<T, R>;
export function compose<T, A, B, C, D, E, R>(
  a: Func<T, A>,
  b: Func<A, B>,
  c: Func<B, C>,
  d: Func<C, D>,
  e: Func<D, E>,
  f: Func<E, R>
): Func<T, R>;
export function compose<T, A, B, C, D, E, F, R>(
  a: Func<T, A>,
  b: Func<A, B>,
  c: Func<B, C>,
  d: Func<C, D>,
  e: Func<D, E>,
  f: Func<E, F>,
  g: Func<F, R>
): Func<T, R>;
export function compose<T, A, B, C, D, E, F, G, R>(
  a: Func<T, A>,
  b: Func<A, B>,
  c: Func<B, C>,
  d: Func<C, D>,
  e: Func<D, E>,
  f: Func<E, F>,
  g: Func<F, G>,
  h: Func<G, R>
): Func<T, R>;
export function compose<T, A, B, C, D, E, F, G, H, R>(
  a: Func<T, A>,
  b: Func<A, B>,
  c: Func<B, C>,
  d: Func<C, D>,
  e: Func<D, E>,
  f: Func<E, F>,
  g: Func<F, G>,
  h: Func<G, H>,
  i: Func<H, R>
): Func<T, R>;
export function compose(
  ...decoders: Func<unknown, unknown>[]
): Func<unknown, unknown> {
  return (input) => {
    return decoders.reduce((last, decoder) => {
      if (isInvalid(last)) {
        return last;
      } else {
        return decoder(last);
      }
    }, input);
  };
}
/* eslint-enable padding-line-between-statements */

/* eslint-disable padding-line-between-statements */
/**
 * Returns a mapper that returns the first defined result of a mapper. If all
 * mappers return `undefined`, then `undefined` is returned.
 */
export function pickFirst<T, A, B>(
  a: Func<T, A | undefined>,
  b: Func<T, B | undefined>
): Func<T, A | B | undefined>;
export function pickFirst<T, A, B, C>(
  a: Func<T, A | undefined>,
  b: Func<T, B | undefined>,
  c: Func<T, C | undefined>
): Func<T, A | B | C | undefined>;
export function pickFirst<T, A, B, C, D>(
  a: Func<T, A | undefined>,
  b: Func<T, B | undefined>,
  c: Func<T, C | undefined>,
  d: Func<T, D | undefined>
): Func<T, A | B | C | undefined>;
export function pickFirst<T, A, B, C, D, E>(
  a: Func<T, A | undefined>,
  b: Func<T, B | undefined>,
  c: Func<T, C | undefined>,
  d: Func<T, D | undefined>,
  e: Func<T, E | undefined>
): Func<T, A | B | C | D | E | undefined>;
export function pickFirst<T, A, B, C, D, E, F>(
  a: Func<T, A | undefined>,
  b: Func<T, B | undefined>,
  c: Func<T, C | undefined>,
  d: Func<T, D | undefined>,
  e: Func<T, E | undefined>,
  f: Func<T, F | undefined>
): Func<T, A | B | C | D | E | F | undefined>;
export function pickFirst<T, A, B, C, D, E, F, G>(
  a: Func<T, A | undefined>,
  b: Func<T, B | undefined>,
  c: Func<T, C | undefined>,
  d: Func<T, D | undefined>,
  e: Func<T, E | undefined>,
  f: Func<T, F | undefined>,
  g: Func<T, G | undefined>
): Func<T, A | B | C | D | E | F | G | undefined>;
export function pickFirst<T, A, B, C, D, E, F, G, H>(
  a: Func<T, A | undefined>,
  b: Func<T, B | undefined>,
  c: Func<T, C | undefined>,
  d: Func<T, D | undefined>,
  e: Func<T, E | undefined>,
  f: Func<T, F | undefined>,
  g: Func<T, G | undefined>,
  h: Func<T, H | undefined>
): Func<T, A | B | C | D | E | F | G | H | undefined>;
export function pickFirst<T, A, B, C, D, E, F, G, H, I>(
  a: Func<T, A | undefined>,
  b: Func<T, B | undefined>,
  c: Func<T, C | undefined>,
  d: Func<T, D | undefined>,
  e: Func<T, E | undefined>,
  f: Func<T, F | undefined>,
  g: Func<T, G | undefined>,
  h: Func<T, H | undefined>,
  i: Func<T, I | undefined>
): Func<T, A | B | C | D | E | F | G | H | I | undefined>;
export function pickFirst(
  ...decoders: Func<unknown, unknown | undefined>[]
): Func<unknown, unknown | undefined> {
  return (input) => {
    return decoders.reduce((value, decoder) => {
      if (value === undefined) {
        return decoder(input);
      } else {
        return value;
      }
    }, undefined as unknown);
  };
}
/* eslint-enable padding-line-between-statements */
