import {
  defineBoolean,
  defineNumber,
  defineParams,
  defineString,
} from '../paramsBuilder';

interface Foo<T> {
  value: T;
}

describe(defineBoolean, () => {
  const builder = defineBoolean<Foo<boolean>>('param', 'value');

  it('converts true to `on`', () => {
    expect(builder({ value: true })).toMatchObject({ param: 'on' });
  });

  it('converts false to `off`', () => {
    expect(builder({ value: false })).toMatchObject({ param: 'off' });
  });
});

describe(defineNumber, () => {
  const builder = defineNumber<Foo<number>>('param', 'value');

  it('converts number to string', () => {
    expect(builder({ value: 1.5 })).toMatchObject({ param: '1.5' });
  });
});

describe(defineString, () => {
  const builder = defineString<Foo<string>>('param', 'value');

  it('sets string', () => {
    expect(builder({ value: 'str' })).toMatchObject({ param: 'str' });
  });
});

describe(defineParams, () => {
  const builder = defineParams<{ foo: number; bar: number }>(
    defineNumber('param1', 'foo'),
    defineNumber('param2', 'bar')
  );

  it('applies each definition', () => {
    expect(builder({ foo: 1, bar: 2 })).toMatchObject({
      param1: '1',
      param2: '2',
    });
  });
});
