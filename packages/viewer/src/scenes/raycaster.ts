import { StreamApi } from '@vertexvis/stream-api';
import { Point } from '@vertexvis/geometry';
import { vertexvis } from '@vertexvis/frame-streaming-protos';

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
   */
  public async hitItems(
    point: Point.Point
  ): Promise<vertexvis.protobuf.stream.IHitItemsResult | undefined> {
    const res = await this.stream.hitItems({ point }, true);
    return res.hitItems || undefined;
  }
}
