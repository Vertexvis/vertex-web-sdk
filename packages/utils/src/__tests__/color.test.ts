import * as Color from '../color';

describe(Color.fromNumber, () => {
  it('converts a number to a color', () => {
    const black = Color.fromNumber(0x000000);
    const white = Color.fromNumber(0xffffff);
    expect(black).toEqual({ r: 0, g: 0, b: 0, a: 255 });
    expect(white).toEqual({ r: 255, g: 255, b: 255, a: 255 });
  });
});

describe(Color.fromHexString, () => {
  it('should parse #00ff00', () => {
    const color = Color.fromHexString('#00ff00');
    expect(color).toEqual(Color.create(0, 255, 0));
  });

  it('should parse 0x00ff00', () => {
    const color = Color.fromHexString('0x00ff00');
    expect(color).toEqual(Color.create(0, 255, 0));
  });

  it('should parse 00ff00', () => {
    const color = Color.fromHexString('00ff00');
    expect(color).toEqual(Color.create(0, 255, 0));
  });
});

describe(Color.fromCss, () => {
  it('converts rgb(num, num, num)', () => {
    const css = 'rgb(1, 2, 3)';
    const color = Color.fromCss(css);
    expect(color).toEqual({ r: 1, g: 2, b: 3, a: 255 });
  });

  it('converts rgba(num, num, num, num)', () => {
    const css = 'rgba(1, 2, 3, 0.5)';
    const color = Color.fromCss(css);
    expect(color).toEqual({ r: 1, g: 2, b: 3, a: 127 });
  });

  it('converts #00ff00', () => {
    const color = Color.fromCss('#00ff00');
    expect(color).toEqual(Color.create(0, 255, 0));
  });
});

describe(Color.toHexString, () => {
  it('converts a color to a hex string', () => {
    const color = Color.create(255, 0, 0);
    expect(Color.toHexString(color)).toEqual('#ff0000');
  });
});
