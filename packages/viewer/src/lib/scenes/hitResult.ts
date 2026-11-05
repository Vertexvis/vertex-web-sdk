import type { vertexvis } from '@vertexvis/frame-streaming-protos';

/**
 * An ancestor of a scene item on a hit result.
 *
 * A child part revision instance id belongs to its parent revision, so two
 * copies of a sub-assembly contain children with the same instance id. The
 * ancestor chain is what tells those copies apart.
 */
export interface HitItemAncestor
  extends vertexvis.protobuf.stream.IHitItemAncestor {
  /**
   * Part revision instance this ancestor was created from.
   *
   * Unset for a root item and for a `-geom` surrogate item (a revision's own
   * geometry when it also has children). When set, `hex` matches the id
   * `GET /part-revision-instances` returns.
   */
  partInstanceId?: vertexvis.protobuf.core.IUuid | null;
}

/**
 * A scene item intersected by {@link Raycaster.hitItems}.
 *
 * `partInstanceId` is the part revision instance the hit scene item
 * (`itemId`) was created from. `leafPartInstanceId` is the instance the leaf
 * scene item (`leafItemId`) was created from. These can differ when an end
 * item collapses the path.
 */
export interface Hit extends vertexvis.protobuf.stream.IHit {
  /**
   * Part revision instance the hit scene item (`itemId`) was created from.
   *
   * Unset for a root item and for a `-geom` surrogate item (a revision's own
   * geometry when it also has children). When set, `hex` matches the id
   * `GET /part-revision-instances` returns.
   */
  partInstanceId?: vertexvis.protobuf.core.IUuid | null;

  /**
   * Part revision instance the leaf scene item (`leafItemId`) was created
   * from.
   *
   * This can differ from {@link Hit.partInstanceId} when an end item
   * collapses the path. Unset for a root item and for a `-geom` surrogate
   * item (a revision's own geometry when it also has children). When set,
   * `hex` matches the id `GET /part-revision-instances` returns.
   */
  leafPartInstanceId?: vertexvis.protobuf.core.IUuid | null;

  /**
   * Ancestors of the hit scene item. Each
   * {@link HitItemAncestor.partInstanceId} is unset for a root item and for
   * a `-geom` surrogate item.
   */
  ancestors?: HitItemAncestor[] | null;
}

/**
 * Items intersected by a raycast.
 *
 * See {@link Hit} for the part revision instance ids carried on each hit.
 */
export interface HitItemsResult
  extends vertexvis.protobuf.stream.IHitItemsResult {
  /**
   * Scene items intersected by the ray.
   */
  hits?: Hit[] | null;
}
