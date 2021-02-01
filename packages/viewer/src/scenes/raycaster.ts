import { StreamApi } from '@vertexvis/stream-api';
import { Point } from '@vertexvis/geometry';
import { vertexvis } from '@vertexvis/frame-streaming-protos';

/**
 * Additional fields that can be included with hit results.
 */
export type HitResultInclude = 'bounding-box';

/**
 * The `Raycaster` class is here.
 */
export class Raycaster {
  public constructor(private stream: StreamApi) {}

  /**
   * Performs request on the stream to find items that intersect
   * the given point.
   *
   * @param point The point to cast from looking for intersections.
   * @param include (optional) Additional fields to be returned with each hit item.
   * See the `HitResultInclude` type for available fields.
   */
  public async hitItems(
    point: Point.Point,
    include?: HitResultInclude[]
  ): Promise<vertexvis.protobuf.stream.IHitItemsResult | undefined> {
    const res = await this.stream.hitItems(
      {
        point,
        includeBoundingBox: include && include.includes('bounding-box'),
      },
      true
    );
    return res.hitItems || undefined;
  }
}
