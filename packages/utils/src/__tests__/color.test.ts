import * as Color from '../color';

describe(Color.fromNumber, () => {
  it('converts a number to a color', () => {
    const black = Color.fromNumber(0x000000);
    const white = Color.fromNumber(0xffffff);
    const color3 = Color.fromNumber(0x00ff00aa, true);
    expect(black).toEqual({ r: 0, g: 0, b: 0, a: 255 });
    expect(white).toEqual({ r: 255, g: 255, b: 255, a: 255 });
    expect(color3).toEqual({ r: 0, g: 255, b: 0, a: 170 });
  });
});

describe(Color.fromHexString, () => {
  it('should parse #00ff00', () => {
    const color = Color.fromHexString('#00ff00');
    expect(color).toEqual(Color.create(0, 255, 0));
  });

  it('should parse 0x00ff00', () => {
    const color = Color.fromHexString('0xff0000');
    expect(color).toEqual(Color.create(255, 0, 0));
  });

  it('should parse 00ff00', () => {
    const color = Color.fromHexString('0000ff');
    expect(color).toEqual(Color.create(0, 0, 255));
  });

  it('should parse alpha too', () => {
    const color = Color.fromHexString('#00ff00aa');
    expect(color).toEqual(Color.create(0, 255, 0, 170));
  });
});

describe(Color.fromCss, () => {
  it('converts rgb(num, num, num)', () => {
    const color = Color.fromCss('rgb(1, 2, 3)');
    expect(color).toEqual({ r: 1, g: 2, b: 3, a: 255 });
  });

  it('converts rgba(num, num, num, num)', () => {
    const color = Color.fromCss('rgba(100, 200, 30, 0.5)');
    expect(color).toEqual({ r: 100, g: 200, b: 30, a: 127 });
    const color2 = Color.fromCss('rgba(45, 90, 120, 1)');
    expect(color2).toEqual({ r: 45, g: 90, b: 120, a: 255 });
  });

  it('converts rgb hex #00ff00', () => {
    const color = Color.fromCss('#00ff00');
    expect(color).toEqual(Color.create(0, 255, 0));
    const color2 = Color.fromCss('#aabbcc');
    expect(color2).toEqual({ r: 170, g: 187, b: 204, a: 255 });
  });

  it('converts rgba hex #00ff00ff', () => {
    const color = Color.fromCss('#00ff00aa');
    expect(color).toEqual(Color.create(0, 255, 0, 170));
    const color2 = Color.fromCss('#aabbccdd');
    expect(color2).toEqual({ r: 170, g: 187, b: 204, a: 221 });
  });
});

describe(Color.toHexString, () => {
  it('converts a color to a hex string', () => {
    const color = Color.create(255, 0, 0);
    expect(Color.toHexString(color)).toEqual('#ff0000');
  });
});
