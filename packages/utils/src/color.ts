const hexRegex = /^(#|0x)?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/;

/**
 * A `Color` represents an object containing values for red, green, blue and
 * alpha channels. Each value represents a number between 0 and 255.
 */
export interface Color {
  r: number; // red channel value, from 0 to 255.
  g: number; // green channel value, from 0 to 255.
  b: number; // blue channel value, from 0 to 255.
  a: number; // alpha channel value, from 0 to 255.
}

/**
 * Constructs a new color with the given red, green, blue and alpha values. If
 * alpha is undefined, defaults to 1.
 */
export const create = (r: number, g: number, b: number, a = 255): Color => ({
  r,
  g,
  b,
  a,
});

/**
 * Converts a numeric color value containing red, green and blue values to a
 * `Color`. The alpha channel will default to fully opaque.
 */
export const fromNumber = (num: number, hasAlpha = false): Color => {
  // tslint:disable:no-bitwise
  const value = hasAlpha ? num : ((num & 0xffffff) << 8) | 0xff;

  return create(
    (value >> 24) & 0xff,
    (value >> 16) & 0xff,
    (value >> 8) & 0xff,
    value & 0xff
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
    const hex = match[2];
    return fromNumber(parseInt(hex, 16), hex.length === 8);
  }
};

/**
 * Creates a `Color` from a CSS color value. This function currently only
 * supports `rgb(255, 255, 255)`, `rgba(255, 255, 255, 0.5)` or `"#FFFFFF"`.
 * expects valid css color strings.
 * @returns Color or `undefined` if the color cannot be parsed.
 */
export const fromCss = (css: string): Color | undefined => {
  if (css.startsWith('rgb')) {
    const numbers = extractNumbersFromString(css);
    if (numbers.length <= 3) {
      return create(numbers[0], numbers[1], numbers[2]);
    }
    return create(
      numbers[0],
      numbers[1],
      numbers[2],
      Math.floor(Number(`${numbers[3]}.${numbers[4] ?? 0}`) * 255)
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
export const isInvisible = (color: Color): boolean => color.a === 0;

/**
 * Returns `true` if the alpha channel of this color is fully opaque (255).
 */
export const isOpaque = (color: Color): boolean => color.a === 255;

/**
 * Converts a `Color` to a hex string - prefixed with `#`. ignores alpha value.
 */
export const toHexString = (color: Omit<Color, 'a'>): string =>
  `#${componentToHex(color.r)}${componentToHex(color.g)}${componentToHex(color.b)}`;

/**
 * Takes rgb(a) component numeric value (0-255) and converts it to hexidecimal
 */
const componentToHex = (num: number): string => {
  const hex = num.toString(16);
  return hex.length === 1 ? '0' + hex : hex;
};

const extractNumbersFromString = (stringWithNumbers: string): number[] => {
  const matches = stringWithNumbers.match(/\d+/g); // Matches all digits in the string
  if (matches) {
    return matches.map(Number); // Converts each match to a number
  }
  return []; // Return an empty array if no numbers are found
};
