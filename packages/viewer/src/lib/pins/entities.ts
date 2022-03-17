import { vertexvis } from '@vertexvis/frame-streaming-protos';
import { Point, Vector3 } from '@vertexvis/geometry';
import { Mapper } from '@vertexvis/utils';

import { fromPbVector3f } from '../mappers';
import { Viewport } from '../types';

export class PinEntity {
  public constructor(
    public readonly worldPosition: Vector3.Vector3,
    public readonly point: Point.Point
  ) {}

  // public static fromHit(point: Point.Point, rect: DOMRect): PinEntity {
  //   const viewport = new Viewport(rect.width, rect.height);
  //   const markerPoint = viewport.transformPointToWorldSpace(point, depthBuffer);
  //   if (hit.hitPoint != null && hit.modelEntity != null) {
  //     const hitPoint = Mapper.ifInvalidThrow(fromPbVector3f)(hit.hitPoint);
  //     return new PinEntity(hitPoint);
  //   } else {
  //     throw new Error(
  //       'Cannot create PinEntity from Hit. Hit is missing hit point and model entity'
  //     );
  //   }
  // }
}
