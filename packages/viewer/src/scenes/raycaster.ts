import { StreamApi } from '@vertexvis/stream-api';
import { Point } from '@vertexvis/geometry';
import { vertexvis } from '@vertexvis/frame-streaming-protos';
import { UUID } from '@vertexvis/utils';

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
  ): Promise<vertexvis.protobuf.stream.IStreamResponse> {
    return this.stream.hitItems(UUID.create(), { point });
  }
}
