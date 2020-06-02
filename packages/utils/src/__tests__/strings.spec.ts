import * as Strings from '../strings';

describe(Strings.trimStart, () => {
  it('should trim starting whitespace', () => {
    const str = '   foo';
    expect(Strings.trim(str)).toEqual('foo');
  });
});

describe(Strings.trimEnd, () => {
  it('should trim ending whitespace', () => {
    const str = 'foo    ';
    expect(Strings.trim(str)).toEqual('foo');
  });
});

describe(Strings.trim, () => {
  it('should trim start and end whitespace', () => {
    const str = '     foo  ';
    expect(Strings.trim(str)).toEqual('foo');
  });
});
