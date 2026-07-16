import {
  defineBoolean,
  defineNumber,
  defineParams,
  defineString,
} from '../paramsBuilder';

interface Foo<T> {
  value: T;
}

interface OptionalFoo<T> {
  value?: T;
}

describe('defineBoolean', () => {
  const builder = defineBoolean<Foo<boolean>>('param', 'value');
  const optionalBuilder = defineBoolean<OptionalFoo<boolean>>('param', 'value');

  it('converts true to `on`', () => {
    expect(builder({ value: true })).toEqual({ param: 'on' });
  });

  it('converts false to `off`', () => {
    expect(builder({ value: false })).toEqual({ param: 'off' });
  });

  it('omits undefined values', () => {
    expect(optionalBuilder({})).toEqual({});
  });

  it('omits non-boolean values', () => {
    expect(builder({ value: 'true' } as unknown as Foo<boolean>)).toEqual({});
  });
});

describe('defineNumber', () => {
  const builder = defineNumber<Foo<number>>('param', 'value');
  const optionalBuilder = defineNumber<OptionalFoo<number>>('param', 'value');

  it('converts number to string', () => {
    expect(builder({ value: 1.5 })).toEqual({ param: '1.5' });
  });

  it('omits undefined values', () => {
    expect(optionalBuilder({})).toEqual({});
  });

  it('omits non-number values', () => {
    expect(builder({ value: '1.5' } as unknown as Foo<number>)).toEqual({});
  });
});

describe('defineString', () => {
  const builder = defineString<Foo<string>>('param', 'value');
  const optionalBuilder = defineString<OptionalFoo<string>>('param', 'value');

  it('sets string', () => {
    expect(builder({ value: 'str' })).toEqual({ param: 'str' });
  });

  it('omits undefined values', () => {
    expect(optionalBuilder({})).toEqual({});
  });

  it('omits non-string values', () => {
    expect(builder({ value: 1 } as unknown as Foo<string>)).toEqual({});
  });
});

describe('defineParams', () => {
  const builder = defineParams<{ foo: number; bar: number }>(
    defineNumber('param1', 'foo'),
    defineNumber('param2', 'bar'),
  );

  it('applies each definition', () => {
    expect(builder({ foo: 1, bar: 2 })).toEqual({
      param1: '1',
      param2: '2',
    });
  });

  it('returns an empty object when no definitions are provided', () => {
    expect(defineParams<Record<string, never>>()({})).toEqual({});
  });

  it('uses the last value when multiple definitions set the same param', () => {
    const builder = defineParams<{ first: string; second: string }>(
      defineString('param', 'first'),
      defineString('param', 'second'),
    );

    expect(builder({ first: 'one', second: 'two' })).toEqual({ param: 'two' });
  });
});

describe('type constraints', () => {
  interface Settings {
    enabled?: boolean;
    limit?: number;
    label?: string;
  }

  it('allows helpers to reference matching optional property types', () => {
    defineBoolean<Settings>('enabled', 'enabled');
    defineNumber<Settings>('limit', 'limit');
    defineString<Settings>('label', 'label');
  });

  it('rejects helpers that reference mismatched property types', () => {
    // @ts-expect-error boolean params cannot reference number properties.
    defineBoolean<Settings>('limit', 'limit');

    // @ts-expect-error number params cannot reference string properties.
    defineNumber<Settings>('label', 'label');

    // @ts-expect-error string params cannot reference boolean properties.
    defineString<Settings>('enabled', 'enabled');
  });
});
