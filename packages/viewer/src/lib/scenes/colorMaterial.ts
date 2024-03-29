import { Color } from '@vertexvis/utils';

/**
 * The `ColorMaterial` interface is here.
 */
export interface ColorMaterial {
  opacity: number;
  glossiness: number;
  diffuse: Color.Color;
  ambient: Color.Color;
  specular: Color.Color;
  emissive: Color.Color;
}

export const defaultColor: ColorMaterial = {
  opacity: 255,
  glossiness: 4,
  diffuse: {
    r: 0,
    g: 0,
    b: 0,
    a: 0,
  },
  ambient: {
    r: 0,
    g: 0,
    b: 0,
    a: 0,
  },

  specular: {
    r: 0,
    g: 0,
    b: 0,
    a: 0,
  },
  emissive: {
    r: 0,
    g: 0,
    b: 0,
    a: 0,
  },
};

/**
 * This helper creates an rgb value color
 * @param hex
 * @param opacity
 */
export const create = (
  r: number,
  g: number,
  b: number,
  opacity?: number
): ColorMaterial => {
  return {
    ...defaultColor,
    opacity: opacity ?? defaultColor.opacity,
    diffuse: {
      r,
      g,
      b,
      a: 0,
    },
  };
};

/**
 * This helper converts a hex string to a ColorMaterial object
 * @param hex
 * @param opacity
 */
export const fromHex = (hex: string, opacity?: number): ColorMaterial => {
  const color = Color.fromHexString(hex);

  return {
    ...defaultColor,
    opacity: opacity ?? defaultColor.opacity,
    diffuse: color != null ? { ...color } : { ...defaultColor.diffuse },
  };
};
