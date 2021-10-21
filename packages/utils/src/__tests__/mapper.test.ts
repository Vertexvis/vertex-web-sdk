import * as Mapper from '../mapper';

describe(Mapper.required, () => {
  const mapper = Mapper.required<string>('required');

  it('returns input if not null', () => {
    const res = mapper('test');
    expect(res).toBe('test');
  });

  it('returns invalid if not defined', () => {
    const res = mapper(null);
    expect(res).toMatchObject({
      errors: expect.anything(),
    });
  });
});

describe(Mapper.requiredProp, () => {
  const mapper = Mapper.requiredProp<{ foo: string | null }, 'foo'>('foo');

  it('returns prop value if not null', () => {
    const res = mapper({ foo: 'test' });
    expect(res).toBe('test');
  });

  it('returns invalid if prop not defined', () => {
    const res = mapper({ foo: null });
    expect(res).toMatchObject({
      errors: expect.anything(),
    });
  });
});

describe(Mapper.ifDefined, () => {
  const mapper = Mapper.ifDefined<string, number>((str) => parseInt(str));

  it('returns result from function if defined', () => {
    const res = mapper('1');
    expect(res).toBe(1);
  });

  it('returns null if not defined', () => {
    const res = mapper(null);
    expect(res).toBeNull();
  });
});

describe(Mapper.getProp, () => {
  const mapper = Mapper.getProp<{ foo: string }, 'foo'>('foo');

  it('returns the value of prop', () => {
    const res = mapper({ foo: 'test' });
    expect(res).toBe('test');
  });
});

describe(Mapper.mapProp, () => {
  const mapper = Mapper.mapProp<{ foo: string }, 'foo', number>('foo', (str) =>
    parseInt(str)
  );

  it('returns result of mapper', () => {
    const res = mapper({ foo: '1' });
    expect(res).toBe(1);
  });
});

describe(Mapper.mapArray, () => {
  const mapper = Mapper.mapArray<string | null, number>(
    Mapper.compose(Mapper.required(''), (str) => parseInt(str))
  );

  it('returns empty array if input is empty', () => {
    const res = mapper([]);
    expect(res).toEqual([]);
  });

  it('returns mapped values if valid', () => {
    const res = mapper(['1', '2']);
    expect(res).toEqual([1, 2]);
  });

  it('returns invalid if value is invalid', () => {
    const res = mapper([null, '1', null]);
    expect(res).toEqual(
      expect.objectContaining({
        errors: expect.arrayContaining([expect.anything(), expect.anything()]),
      })
    );
  });
});

describe(Mapper.mapRequiredProp, () => {
  const mapper = Mapper.mapRequiredProp<{ foo: string | null }, 'foo', number>(
    'foo',
    (str) => parseInt(str)
  );

  it('invokes mapping function if prop is defined', () => {
    const res = mapper({ foo: '1' });
    expect(res).toBe(1);
  });

  it('returns invalid if value is not defined', () => {
    const res = mapper({ foo: null });
    expect(res).toEqual(
      expect.objectContaining({
        errors: expect.arrayContaining([expect.anything()]),
      })
    );
  });
});

describe(Mapper.ifInvalidThrow, () => {
  const mapper = Mapper.ifInvalidThrow(Mapper.required<string>(''));

  it('returns value if valid', () => {
    const res = mapper('test');
    expect(res).toBe('test');
  });

  it('throws if not valid', () => {
    expect(() => mapper(null)).toThrowError();
  });
});

describe(Mapper.read, () => {
  const mapper = Mapper.read<string | null, string, number>(
    Mapper.compose(Mapper.required(''), (str) => str),
    Mapper.compose(Mapper.required(''), (str) => parseInt(str))
  );

  it('returns mapped values as array', () => {
    const res = mapper('1');
    expect(res).toEqual(['1', 1]);
  });

  it('concats invalid values', () => {
    const res = mapper(null);
    expect(res).toMatchObject({
      errors: expect.arrayContaining([
        expect.stringContaining('required'),
        expect.stringContaining('required'),
      ]),
    });
  });
});

describe(Mapper.compose, () => {
  const mapper = Mapper.compose<string | null, string, number>(
    Mapper.required(''),
    (str) => parseInt(str.toString())
  );

  it('returns composed value', () => {
    const res = mapper('1');
    expect(res).toEqual(1);
  });

  it('returns first invalidation', () => {
    const res = mapper(null);
    expect(res).toMatchObject({
      errors: expect.arrayContaining([expect.stringContaining('required')]),
    });
  });
});

describe(Mapper.defineMapper, () => {
  const mapper = Mapper.defineMapper<string | null, [string], number>(
    Mapper.read(Mapper.required('')),
    ([str]) => parseInt(str)
  );

  it('returns result from builder if valid', () => {
    const res = mapper('1');
    expect(res).toBe(1);
  });

  it('returns invalid', () => {
    const res = mapper(null);
    expect(res).toMatchObject({
      errors: expect.arrayContaining([expect.stringContaining('required')]),
    });
  });
});

describe(Mapper.pickFirst, () => {
  const mapper = Mapper.pickFirst<number, number, number>(
    (input) => {
      if (input >= 0 && input < 10) {
        return input;
      } else {
        return undefined;
      }
    },
    (input) => {
      if (input >= 20 && input < 30) {
        return input;
      } else {
        return undefined;
      }
    }
  );

  it('returns first defined result', () => {
    expect(mapper(20)).toBe(20);
  });

  it('returns undefined if no defined result', () => {
    expect(mapper(50)).toBeUndefined();
  });
});
