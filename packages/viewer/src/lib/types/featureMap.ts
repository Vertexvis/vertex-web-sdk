import { Point, Rectangle } from '@vertexvis/geometry';
import { Color } from '@vertexvis/utils';
import type { DecodedPng } from 'fast-png';

import { EntityType } from './entities';
import { FrameImageLike, ImageAttributesLike } from './frame';

/**
 * A `FeatureMap` contains metadata about the location of entities and features
 * rendered in a scene. This metadata includes any surfaces, edges, cross
 * sections and BREP.
 */
export class FeatureMap implements FrameImageLike {
  /**
   * Constructor.
   *
   * @param pixels The PNG containing feature information of a frame.
   * @param imageAttr The attributes of the feature map image.
   */
  public constructor(
    private readonly pixels: Uint8Array,
    public readonly imageAttr: ImageAttributesLike
  ) {}

  /**
   * Constructs a new `FeatureMap` from a decoded PNG.
   *
   * @param png The decoded PNG data.
   * @param imageAttr The image attributes of the frame.
   * @returns A new feature map.
   */
  public static fromPng(
    png: Pick<DecodedPng, 'data' | 'width' | 'height' | 'channels'>,
    imageAttr: ImageAttributesLike
  ): FeatureMap {
    if (!(png.data instanceof Uint8Array)) {
      throw new Error(
        'Cannot create FeatureMap. Expected decoded PNG to be a Uint8Array.'
      );
    } else if (png.channels !== 4) {
      throw new Error('Cannot create FeatureMap. Missing alpha channel.');
    } else {
      return new FeatureMap(png.data, {
        ...imageAttr,
        // TODO(dan): Need to change frame protos to include image attributes
        // per image artifact.
        imageRect: Rectangle.fromPointAndDimensions(imageAttr.imageRect, png),
      });
    }
  }

  /**
   * Returns the type of entity at the given frame location. If no entity is
   * found, then `undefined` is returned.
   *
   * @param point The point to query.
   * @returns The type of entity at the given location, or `undefined` if no
   * entity exists.
   */
  public getEntityType(point: Point.Point): EntityType {
    const color = this.getColor(point);

    if (color?.a === EntityType.CROSS_SECTION) {
      return EntityType.CROSS_SECTION;
    } else if (color?.a === EntityType.GENERIC_GEOMETRY) {
      return EntityType.GENERIC_GEOMETRY;
    } else if (color?.a === EntityType.IMPRECISE_EDGE) {
      return EntityType.IMPRECISE_EDGE;
    } else if (color?.a === EntityType.IMPRECISE_SURFACE) {
      return EntityType.IMPRECISE_SURFACE;
    } else if (color?.a === EntityType.PRECISE_EDGE) {
      return EntityType.PRECISE_EDGE;
    } else if (color?.a === EntityType.PRECISE_SURFACE) {
      return EntityType.PRECISE_SURFACE;
    } else {
      return EntityType.NO_GEOMETRY;
    }
  }

  private getColor(point: Point.Point): Color.Color | undefined {
    const { width, height } = this.imageAttr.imageRect;

    const offset = Point.subtract(point, this.imageAttr.imageRect);
    const scale = 1 / this.imageAttr.imageScale;
    const pixel = Point.scale(offset, scale, scale);

    if (pixel.x >= 0 && pixel.y >= 0 && pixel.x < width && pixel.y < height) {
      const index = Math.floor(pixel.x) * 4 + Math.floor(pixel.y) * 4 * width;

      const r = this.pixels[index];
      const g = this.pixels[index + 1];
      const b = this.pixels[index + 2];
      const a = this.pixels[index + 3];

      return Color.create(r, g, b, a);
    } else return undefined;
  }
}
