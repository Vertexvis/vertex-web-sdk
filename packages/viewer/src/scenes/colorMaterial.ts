import { Color } from '@vertexvis/utils';

/**
 * The `ColorMaterial` interface is here.
 */
export interface ColorMaterial {
  opacity: number;
  glossiness: number;
  ambient: Color.Color;
  diffuse: Color.Color;
  specular: Color.Color;
  emissive: Color.Color;
}

export const fromHex = (hex: string, opacity?: number): ColorMaterial => {
  const color: Color.Color = Color.fromHexString(hex);

  return {
    opacity: 100,
    glossiness: opacity || 10,
    ambient: {
      ...color,
    },
    diffuse: {
      ...color,
    },
    specular: {
      ...color,
    },
    emissive: {
      ...color,
    },
  };
};
