import { Point } from '@vertexvis/geometry';
import { StreamApi } from '@vertexvis/stream-api';

import { HitItemsResult } from './hitResult';
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
    options?: RaycasterOptions,
  ): Promise<HitItemsResult | undefined>;
}

/**
 * The `Raycaster` class is here.
 */
export class Raycaster implements RaycasterLike {
  public constructor(
    private stream: StreamApi,
    private imageScaleProvider: ImageScaleProvider,
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
   *   // Query the scene for the item at the position of the `tap` event.
   *   // `partInstanceId` is unset for a root item and for a `-geom` surrogate.
   *   const result = await raycaster.hitItems(event.detail.position);
   *   const hit = result?.hits?.[0];
   *
   *   if (hit?.itemId?.hex != null) {
   *     // If there was an item present at the position, select it
   *     await scene.elements((op) =>
   *       op.items.where((q) => q.withItemId(hit.itemId.hex)).select()
   *     );
   *   }
   * });
   * ```
   *
   * @see {@link Scene.items} for more information on the operations that
   * can be performed on a hit result.
   *
   * Each hit includes the part revision instance ids from the stream `Hit`:
   *
   * - `partInstanceId` is the instance the hit scene item (`itemId`) was
   *   created from.
   * - `leafPartInstanceId` is the instance the leaf scene item
   *   (`leafItemId`) was created from. These can differ when an end item
   *   collapses the path.
   * - `ancestors[].partInstanceId` is the instance each ancestor was created
   *   from. A child instance id belongs to its parent revision, so the
   *   ancestor chain is what tells copies of a sub-assembly apart.
   *
   * Each instance id is unset for a root item and for a `-geom` surrogate
   * item (a revision's own geometry when it also has children). When set, it
   * is a `vertexvis.protobuf.core.Uuid` and `hex` matches the id
   * `GET /part-revision-instances` returns.
   *
   * @param point The point to cast from looking for intersections.
   * @param options Optional set of options for the request @see {@link RaycasterOptions}
   * for available options.
   * @returns The intersected items, including part revision instance ids.
   * `undefined` when the stream returns no hit result.
   */
  public async hitItems(
    point: Point.Point,
    options?: RaycasterOptions,
  ): Promise<HitItemsResult | undefined> {
    const scale = this.imageScaleProvider();
    const res = await this.stream.hitItems(
      {
        point: Point.scale(point, scale?.x || 1, scale?.y || 1),
        includeMetadata: options?.includeMetadata,
      },
      true,
    );
    return res.hitItems || undefined;
  }
}
