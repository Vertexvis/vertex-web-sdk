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
  public hitItems(
    point: Point.Point
  ): Promise<vertexvis.protobuf.stream.IHitItemsResult> {
    return this.stream.hitItems({ point }).then(r => r.hitItems);
  }
}
