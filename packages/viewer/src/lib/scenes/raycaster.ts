import { vertexvis } from '@vertexvis/frame-streaming-protos';
import { Point } from '@vertexvis/geometry';
import { StreamApi } from '@vertexvis/stream-api';

import { ImageScaleProvider } from './scene';

/**
 * Optional raycaster options available on a hit request.
 */
export interface RaycasterOptions {
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
   * @example
   * ```typescript
   * const viewer = document.querySelector("vertex-viewer");
   *
   * viewer.addEventListener("tap", async (event) => {
   *   const scene = await viewer.scene();
   *   const raycaster = scene.raycaster();
   *
   *   // Query the scene for the item at the position of the `tap` event
   *   const [hit] = await raycaster.hitItems(event.detail.position);
   *
   *   if (hit != null) {
   *     // If there was an item present at the position, select it
   *     await scene.items((op) =>
   *       op.where((q) => q.withItemId(hit.itemId.hex)).select()
   *     );
   *   }
   * });
   * ```
   *
   * @see {@link Scene.items} for more information on the operations that
   * can be performed on a hit result.
   *
   * @param point The point to cast from looking for intersections.
   * @param options Optional set of options for the request @see {@link RaycasterOptions}
   * for available options.
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
