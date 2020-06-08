import * as Objects from '../objects';

describe(Objects.defaults, () => {
  it('returns object with props from B that are missing on A', () => {
    const a = { a: 1 };
    const b = { a: 2, b: 3 };
    const result = Objects.defaults(a, b);
    expect(result).toEqual({ a: 1, b: 3 });
  });

  it('returns object with deep props from B that are missing on A', () => {
    const a = { a: { b: 2 } };
    const b = { a: { b: 1, c: 3 } };
    const result = Objects.defaults(a, b);
    expect(result).toEqual({ a: { b: 2, c: 3 } });
  });

  it('does not merge arrays', () => {
    const a = { a: [1, 2] };
    const b = { a: [3, 4] };
    const result = Objects.defaults(a, b);
    expect(result).toEqual({ a: [1, 2] });
  });

  it('supports merging more than 1 default applied left to right', () => {
    const a = { a: 1 };
    const b = { a: 2, b: 3 };
    const c = { a: 3, b: 4, c: 5 };
    const result = Objects.defaults(a, b, c);
    expect(result).toEqual({ a: 1, b: 3, c: 5 });
  });
});

describe(Objects.isPlainObject, () => {
  it('returns true if input is created with plain object prototype', () => {
    expect(Objects.isPlainObject(Object.create({}))).toEqual(true);
  });

  it('returns true if input is created with default object prototype', () => {
    expect(Objects.isPlainObject(Object.create(Object.prototype))).toEqual(
      true
    );
  });

  it('returns true if input is created with object literal', () => {
    expect(Objects.isPlainObject({})).toEqual(true);
  });

  it('returns true if input is created with object constructor', () => {
    expect(Objects.isPlainObject(new Object())).toEqual(true);
  });

  it('returns false if input is null', () => {
    expect(Objects.isPlainObject(null)).toEqual(false);
  });

  it('returns false if input is an array', () => {
    expect(Objects.isPlainObject([])).toEqual(false);
  });

  it('returns false if input is a class', () => {
    class Foo {}
    expect(Objects.isPlainObject(new Foo())).toEqual(false);
  });

  it('returns false if input is a scalar type', () => {
    expect(Objects.isPlainObject(1)).toEqual(false);
  });

  it('returns false if input prototype is null', () => {
    expect(Objects.isPlainObject(Object.create(null))).toEqual(false);
  });
});

describe(Objects.toPairs, () => {
  it('returns pairs for a plain object', () => {
    const obj = { a: 1, b: 2 };
    const result = Objects.toPairs(obj);
    expect(result).toEqual([
      ['a', 1],
      ['b', 2],
    ]);
  });

  it('returns pairs for an array', () => {
    const obj = ['a', 'b'];
    const result = Objects.toPairs(obj);
    expect(result).toEqual([
      ['0', 'a'],
      ['1', 'b'],
    ]);
  });

  it('returns props for class', () => {
    class Foo {
      public a = 1;
      public b = 2;
    }
    const result = Objects.toPairs(new Foo());
    expect(result).toEqual([
      ['a', 1],
      ['b', 2],
    ]);
  });

  it('returns an empty array for null', () => {
    const result = Objects.toPairs(null);
    expect(result).toEqual([]);
  });
});

describe(Objects.fromPairs, () => {
  it('returns object for pairs', () => {
    const pairs = Objects.toPairs({ a: 1, b: 2 });
    const result = Objects.fromPairs(pairs);
    expect(result).toEqual({ a: 1, b: 2 });
  });

  it('returns empty object when pairs is null', () => {
    const result = Objects.fromPairs(null);
    expect(result).toEqual({});
  });
});
