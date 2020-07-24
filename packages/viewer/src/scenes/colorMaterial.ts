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

/**
 * This helper converts a hex string to a ColorMaterial object
 * @param hex
 * @param opacity
 */
export const fromHex = (hex: string, opacity?: number): ColorMaterial => {
  const color: Color.Color = Color.fromHexString(hex);

  return {
    opacity: opacity || 100,
    glossiness: opacity || 10,
    diffuse: {
      ...color,
    },
    ambient: {
      r: 0.7,
      g: 0.75,
      b: 0,
      a: 1,
    },

    specular: {
      r: 0.2,
      g: 0.2,
      b: 0.2,
      a: 64,
    },
    emissive: {
      r: 0.1,
      g: 0,
      b: 0.1,
      a: 1,
    },
  };
};
