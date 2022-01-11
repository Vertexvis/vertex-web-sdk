import { vertexvis } from '@vertexvis/frame-streaming-protos';
import { Point } from '@vertexvis/geometry';
import { StreamApi } from '@vertexvis/stream-api';

import { ImageScaleProvider } from './scene';

/**
 * Optional raycaster options available on a hit request.
 */
interface RaycasterOptions {
  includeMetadata: boolean;
}

export interface RaycasterLike {
  hitItems(
    point: Point.Point,
    options?: RaycasterOptions
  ): Promise<vertexvis.protobuf.stream.IHitItemsResult | undefined>;
}

/**
 * The `Raycaster` class is here.
 */
export class Raycaster implements RaycasterLike {
  public constructor(
    private stream: StreamApi,
    private imageScaleProvider: ImageScaleProvider
  ) {}

  /**
   * Performs request on the stream to find items that intersect
   * the given point.
   *
   * @param point The point to cast from looking for intersections.
   */
  public async hitItems(
    point: Point.Point,
    options?: RaycasterOptions
  ): Promise<vertexvis.protobuf.stream.IHitItemsResult | undefined> {
    const scale = this.imageScaleProvider();
    const res = await this.stream.hitItems(
      {
        point: Point.scale(point, scale?.x || 1, scale?.y || 1),
        includeMetadata: options?.includeMetadata,
      },
      true
    );
    return res.hitItems || undefined;
  }
}
