import type { vertexvis } from '@vertexvis/frame-streaming-protos';
import { Mapper as M } from '@vertexvis/utils';

import { ColorMaterial } from '../..';
import { MaterialOverride } from '../../interfaces';
import { defaultColor } from '../scenes/colorMaterial';
import { fromPbRGBi } from './material';

export const fromPbColorMaterial: M.Func<
  vertexvis.protobuf.core.IColorMaterial,
  ColorMaterial.ColorMaterial
> = M.defineMapper(
  M.read(
    M.requiredProp('d'),
    M.requiredProp('ns'),
    M.mapRequiredProp('ka', fromPbRGBi),
    M.mapRequiredProp('kd', fromPbRGBi),
    M.mapRequiredProp('ks', fromPbRGBi),
    M.mapRequiredProp('ke', fromPbRGBi)
  ),
  ([opacity, glossiness, ambient, diffuse, specular, emissive]) => ({
    opacity,
    glossiness,
    ambient,
    diffuse,
    specular,
    emissive,
  })
);

export const fromPbMaterialOverride: M.Func<
  vertexvis.protobuf.core.IMaterialOverride,
  MaterialOverride
> = M.defineMapper(
  M.read(
    M.mapRequiredProp('defaultMaterial', () => defaultColor),
    M.mapRequiredProp('colorMaterial', fromPbColorMaterial)
  ),
  ([defaultMaterial, colorMaterial]) => ({
    defaultMaterial,
    colorMaterial,
  })
);
