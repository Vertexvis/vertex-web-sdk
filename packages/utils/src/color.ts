const rgbRegex = /rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/;
const rgbaRegex = /rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(.+)\s*\)/;
const hexRegex = /^(#|0x)?([A-Fa-f0-9]{6})$/;

/**
 * A `Color` represents an object containing values for red, green, blue and
 * alpha channels. Each value represents a number between 0 and 255.
 */
export interface Color {
  /**
   * The color's red channel value, as a number from 0 to 255.
   */
  r: number;

  /**
   * The color's green channel value, as a number from 0 to 255.
   */
  g: number;

  /**
   * The color's blue channel value, as a number from 0 to 255.
   */
  b: number;

  /**
   * The color's alpha channel value, as a number from 0 to 255.
   */
  a: number;
}

/**
 * Constructs a new color with the given red, green, blue and alpha values. If
 * alpha is undefined, defaults to 1.
 */
export const create = (r: number, g: number, b: number, a = 255): Color => {
  return { r, g, b, a };
};

/**
 * Converts a numeric color value containing red, green and blue values to a
 * `Color`. The alpha channel will default to fully opaque.
 */
export const fromNumber = (num: number): Color => {
  // tslint:disable:no-bitwise
  const normalized = num & 0xffffff;
  return create(
    (normalized >> 16) & 0xff,
    (normalized >> 8) & 0xff,
    normalized & 0xff
  );
  // tslint:enable:no-bitwise
};

/**
 * Returns a `Color` from a hex string, or undefined if the color string cannot
 * be parsed. Supports hex strings in the format of `"#00FF00"`, `"0x00FF00"` or
 * `"00FF00"`.
 */
export const fromHexString = (str: string): Color | undefined => {
  const match = hexRegex.exec(str);
  if (match != null) {
    return fromNumber(parseInt(match[2], 16));
  }
};

/**
 * Creates a `Color` from a CSS color value. This function currently only
 * supports `rgb(255, 255, 255)`, `rgba(255, 255, 255, 0.5)` or `"#FFFFFF"`.
 * Returns `undefined` if the color cannot be parsed.
 */
export const fromCss = (css: string): Color | undefined => {
  const rgbMatch = rgbRegex.exec(css);
  if (rgbMatch != null) {
    return create(
      parseInt(rgbMatch[1]),
      parseInt(rgbMatch[2]),
      parseInt(rgbMatch[3])
    );
  }

  const rgbaMatch = rgbaRegex.exec(css);
  if (rgbaMatch != null) {
    return create(
      parseInt(rgbaMatch[1]),
      parseInt(rgbaMatch[2]),
      parseInt(rgbaMatch[3]),
      Math.floor(parseFloat(rgbaMatch[4]) * 255)
    );
  }

  if (hexRegex.test(css)) {
    return fromHexString(css);
  }
};

/**
 * Converts an array of four values to a `Color`. The sequence of the array is
 * expected to be `[r, g, b]` or `[r, g, b, a]`.
 */
export const fromArray = (rgba: number[] | Uint8ClampedArray): Color => {
  return create(rgba[0], rgba[1], rgba[2], rgba[3]);
};

/**
 * Returns `true` if the color's alpha channel is 0.
 */
export const isInvisible = (color: Color): boolean => {
  return color.a === 0;
};

/**
 * Returns `true` if the alpha channel of this color is fully opaque (255).
 */
export const isOpaque = (color: Color): boolean => {
  return color.a === 255;
};

/**
 * Converts a `Color` to a hex string. The returned string will be prefixed with
 * `#`.
 */
export const toHexString = (color: Color): string => {
  return `#${componentToHex(color.r)}${componentToHex(color.g)}${componentToHex(
    color.b
  )}`;
};

const componentToHex = (num: number): string => {
  const hex = num.toString(16);
  return hex.length === 1 ? '0' + hex : hex;
};
